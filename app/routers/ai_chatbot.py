import json
import os
import re
from typing import Dict, List, Optional
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Restaurant, User, UserPreference
from app.schemas import ChatRequest, ChatResponse, RestaurantCard

try:
    from langchain_core.output_parsers import PydanticOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_ollama import ChatOllama
except Exception:
    ChatOllama = ChatPromptTemplate = PydanticOutputParser = None

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

PRICE_MAP: Dict[str, List[str]] = {
    "$": ["$", "cheap", "budget", "inexpensive", "affordable"],
    "$$": ["$$", "moderate", "mid range", "mid-range"],
    "$$$": ["$$$", "upscale", "higher end", "higher-end"],
    "$$$$": ["$$$$", "luxury", "fine dining", "expensive"],
}

CUISINE_KW = [
    "italian", "mexican", "chinese", "japanese", "thai", "indian", "korean",
    "french", "american", "mediterranean", "vietnamese", "greek", "burger",
    "pizza", "seafood", "sushi", "bbq", "vegan", "vegetarian", "brunch",
    "steakhouse", "middle eastern",
]

DIETARY_KW = ["vegan", "vegetarian", "halal", "kosher", "gluten-free", "pescatarian"]
AMBIANCE_KW = ["casual", "romantic", "family-friendly", "fine dining", "quiet", "cozy", "outdoor", "trendy"]
OCCASION_KW = ["date", "anniversary", "birthday", "dinner", "lunch", "brunch", "business", "family"]

class ParsedQuery(BaseModel):
    cuisine: Optional[str] = None
    city: Optional[str] = None
    price_tier: Optional[str] = None
    dietary: List[str] = Field(default_factory=list)
    ambiance: List[str] = Field(default_factory=list)
    occasion: Optional[str] = None
    min_rating: Optional[float] = None
    wants_options: bool = False
    wants_web: bool = False

def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip()).lower()


def _normalize_price(value: str) -> str:
    v = _norm(value)
    for tier, aliases in PRICE_MAP.items():
        if v in {_norm(a) for a in aliases}:
            return tier
    return ""

def _load_prefs(db: Session, user: User) -> Dict:
    row = db.query(UserPreference).filter(UserPreference.user_id == user.user_id).first()
    if not row:
        return {"cuisines": [], "price_tier": "", "dietary": [], "ambiance": [], "sort_preference": ""}
    return {
        "cuisines": [c.strip() for c in (getattr(row, "cuisines", None) or [])],
        "price_tier": _normalize_price(getattr(row, "price_range", "") or ""),
        "dietary": [d.strip() for d in (getattr(row, "dietary_needs", None) or [])],
        "ambiance": [a.strip() for a in (getattr(row, "ambiance_preferences", None) or [])],
        "sort_preference": (getattr(row, "sort_preference", "") or "").strip(),
    }


def _db_options(db: Session):
    rows = db.query(Restaurant).all()
    cuisines = sorted({(r.cuisine_type or "").strip() for r in rows if r.cuisine_type})
    cities = sorted({(r.city or "").strip() for r in rows if r.city})
    return cuisines, cities

def _heuristic_parse(
    message: str, history: str, prefs: Dict,
    cuisines: List[str], cities: List[str],
) -> ParsedQuery:
    msg = _norm(message)
    full = _norm(f"{history}\n{message}")

    cuisine = next((c for c in sorted(cuisines, key=len, reverse=True) if c and c.lower() in msg), None)
    if not cuisine:
        cuisine = next((kw.title() for kw in CUISINE_KW if kw in msg), None)
    if not cuisine and prefs.get("cuisines"):
        cuisine = prefs["cuisines"][0]

    city = next((c for c in sorted(cities, key=len, reverse=True) if c and _norm(c) in msg), None)

    price_tier = next(
        (tier for tier, aliases in PRICE_MAP.items() if any(_norm(a) in msg for a in aliases)),
        None,
    )

    min_rating = None
    m = re.search(r"(?:at least|min(?:imum)?|above|over)\s*(\d(?:\.\d)?)", msg)
    if m:
        min_rating = max(0.0, min(5.0, float(m.group(1))))
    elif any(w in msg for w in ("top rated", "top-rated")):
        min_rating = 4.0

    wants_options = any(p in msg for p in ["what cuisines", "available cuisines", "what cities", "list options"])
    wants_web = any(p in msg for p in ["open now", "hours", "events", "trending", "tonight", "this weekend"])

    return ParsedQuery(
        cuisine=cuisine,
        city=city,
        price_tier=price_tier,
        dietary=[d for d in DIETARY_KW  if _norm(d) in full],
        ambiance=[a for a in AMBIANCE_KW if _norm(a) in full],
        occasion=next((o for o in OCCASION_KW if o in full), None),
        min_rating=min_rating,
        wants_options=wants_options,
        wants_web=wants_web,
    )

def _parse_query(
    message: str, history: str, prefs: Dict,
    cuisines: List[str], cities: List[str],
) -> ParsedQuery:
    if not all([ChatOllama, ChatPromptTemplate, PydanticOutputParser]):
        return _heuristic_parse(message, history, prefs, cuisines, cities)

    parser = PydanticOutputParser(pydantic_object=ParsedQuery)
    prompt = ChatPromptTemplate.from_template(
        """Extract restaurant search intent as structured JSON.

User preferences: {prefs}
Available cuisines: {cuisines}
Available cities: {cities}
Conversation history: {history}
User message: {message}

Rules:
- price_tier must be one of $, $$, $$$, $$$$ or null
- dietary, ambiance must be arrays
- wants_options=true only if user asks what cuisines/cities are available
- wants_web=true for: open now, hours, events, trending, tonight, this weekend
- Extract city and cuisine from the current message only, not from history
- Do NOT inject saved preferences unless the user explicitly asked for them

{fmt}"""
    )

    try:
        llm = ChatOllama(model=os.getenv("OLLAMA_MODEL", "llama3"), temperature=0)
        raw = (prompt | llm).invoke({
            "prefs":    json.dumps(prefs),
            "cuisines": ", ".join(cuisines),
            "cities":   ", ".join(cities),
            "history":  history or "None",
            "message":  message,
            "fmt":      parser.get_format_instructions(),
        })
        parsed = parser.parse(getattr(raw, "content", ""))
        if not parsed.cuisine and prefs.get("cuisines"):
            parsed.cuisine = prefs["cuisines"][0]
        if parsed.price_tier:
            parsed.price_tier = _normalize_price(parsed.price_tier)
        return parsed
    except Exception:
        return _heuristic_parse(message, history, prefs, cuisines, cities)

def _search(db: Session, q: ParsedQuery, limit: int = 40) -> List[Restaurant]:
    query = db.query(Restaurant)
    if q.cuisine: query = query.filter(Restaurant.cuisine_type.ilike(f"%{q.cuisine}%"))
    if q.city: query = query.filter(Restaurant.city.ilike(f"%{q.city}%"))
    if q.min_rating: query = query.filter(Restaurant.avg_rating >= q.min_rating)
    return query.limit(limit).all()


def _score(r: Restaurant, q: ParsedQuery, prefs: Dict) -> float:
    blob = _norm(" ".join(filter(None, [
        r.name, r.cuisine_type, r.city,
        getattr(r, "address", ""), getattr(r, "description", ""),
    ])))
    rating = float(r.avg_rating or 0)
    reviews = int(r.review_count or 0)
    r_price = (getattr(r, "price_tier", "") or "") if hasattr(Restaurant, "price_tier") else ""

    score = rating * 20 + min(reviews, 200) * 0.05

    if q.cuisine and r.cuisine_type and q.cuisine.lower() in r.cuisine_type.lower(): score += 30
    if q.city and r.city and q.city.lower() == r.city.lower(): score += 20
    if q.price_tier and r_price == q.price_tier: score += 12
    if q.occasion and q.occasion.lower() in blob: score += 8
    for kw in q.dietary + q.ambiance:
        if kw.lower() in blob: score += 10

    if r.cuisine_type and r.cuisine_type.lower() in [c.lower() for c in prefs.get("cuisines", [])]:
        score += 12
    for kw in prefs.get("dietary", []) + prefs.get("ambiance", []):
        if kw.lower() in blob: score += 5
    pref_price = prefs.get("price_tier", "")
    if pref_price and r_price == pref_price: score += 4

    sort = _norm(prefs.get("sort_preference", ""))
    if sort == "rating":       score += rating * 3
    elif sort == "popularity": score += min(reviews, 300) * 0.05

    return score


def _rank(restaurants: List[Restaurant], q: ParsedQuery, prefs: Dict) -> List[Restaurant]:
    return sorted(
        restaurants,
        key=lambda r: (_score(r, q, prefs), float(r.avg_rating or 0)),
        reverse=True,
    )

def _reason(r: Restaurant, q: ParsedQuery) -> str:
    parts = []
    if q.cuisine and r.cuisine_type and q.cuisine.lower() in r.cuisine_type.lower():
        parts.append(f"matches your {q.cuisine} request")
    if q.city and r.city and q.city.lower() == r.city.lower():
        parts.append(f"in {r.city}")
    if q.price_tier and (getattr(r, "price_tier", "") or "") == q.price_tier:
        parts.append(f"fits your {q.price_tier} budget")
    desc = _norm(getattr(r, "description", "") or "")
    if q.occasion and q.occasion.lower() in desc: parts.append(f"good for {q.occasion}")
    if q.ambiance and q.ambiance[0].lower() in desc: parts.append(f"has a {q.ambiance[0]} vibe")
    if q.dietary and q.dietary[0].lower() in desc: parts.append(f"supports {q.dietary[0]}")
    return ", ".join(parts) or "highly rated and relevant to your search"


def _build_reply(q: ParsedQuery, ranked: List[Restaurant], web_note: str) -> str:
    if not ranked:
        msg = "I couldn't find a strong match. Try broadening your cuisine, city, price, or rating."
        return f"{msg}\n\n{web_note}" if web_note else msg

    details = " ".join(filter(None, [
        q.cuisine,
        f"in {q.city}"      if q.city      else None,
        f"for {q.occasion}" if q.occasion  else None,
    ]))
    header = f"Here are the best matches{' for ' + details if details else ''}:\n"
    lines = []
    for i, r in enumerate(ranked[:3], 1):
        rating = f"{float(r.avg_rating):.1f}" if r.avg_rating is not None else "N/A"
        price = f", {getattr(r, 'price_tier', '')}" if getattr(r, "price_tier", None) else ""
        lines.append(f"{i}. {r.name} ({rating}★{price}) — {_reason(r, q)}")

    reply = header + "\n".join(lines)
    return f"{reply}\n\n{web_note}" if web_note else reply


def _to_cards(restaurants: List[Restaurant]) -> List[RestaurantCard]:
    return [
        RestaurantCard(
            restaurant_id=r.restaurant_id,
            name=r.name,
            cuisine_type=r.cuisine_type,
            city=r.city,
            avg_rating=float(r.avg_rating) if r.avg_rating is not None else None,
            review_count=r.review_count,
            price_tier=getattr(r, "price_tier", None) if hasattr(Restaurant, "price_tier") else None,
        )
        for r in restaurants[:5]
    ]


def _tavily(query: str) -> str:
    key = os.getenv("TAVILY_API_KEY", "").strip()
    if not key:
        return ""
    payload = json.dumps({
        "api_key": key, "query": query,
        "search_depth": "basic", "max_results": 3, "include_answer": True,
    }).encode()
    req = urllib_request.Request(
        "https://api.tavily.com/search",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        snippets = [s for s in [
            (data.get("answer") or "").strip(),
            *[(item.get("content") or "").strip() for item in data.get("results", [])[:2]],
        ] if s]
        return ("Live web info: " + " ".join(snippets[:2])) if snippets else ""
    except (URLError, HTTPError, TimeoutError, json.JSONDecodeError):
        return ""

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = (request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    prefs = _load_prefs(db, current_user)
    cuisines, cities = _db_options(db)
    history = "\n".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in (request.conversation_history or [])[-8:]
    )

    parsed = _parse_query(message, history, prefs, cuisines, cities)

    if parsed.wants_options:
        return ChatResponse(
            reply=(
                f"Available cuisines: {', '.join(cuisines) or 'None found'}\n"
                f"Available cities: {', '.join(cities) or 'None found'}"
            ),
            restaurants=[],
        )

    candidates = _search(db, parsed)
    ranked = _rank(candidates, parsed, prefs)

    web_note = ""
    if parsed.wants_web:
        web_note = _tavily(" ".join(filter(None, [message, parsed.city, parsed.cuisine])))

    return ChatResponse(
        reply=_build_reply(parsed, ranked[:5], web_note),
        restaurants=_to_cards(ranked),
    )


@router.get("/debug")
def debug_search(
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = _load_prefs(db, current_user)
    cuisines, cities = _db_options(db)
    parsed = _parse_query(message, "", prefs, cuisines, cities)
    candidates = _search(db, parsed)
    return {
        "parsed": parsed.model_dump(),
        "prefs": prefs,
        "cuisines": cuisines,
        "cities": cities,
        "candidates": [{"id": r.restaurant_id, "name": r.name, "city": r.city, "cuisine": r.cuisine_type} for r in candidates],
    }