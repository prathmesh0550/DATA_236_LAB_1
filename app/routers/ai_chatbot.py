import json
import os
import re
import uuid
from typing import Dict, List, Optional
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Restaurant, User, UserPreference, AIChat
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
        return {"cuisines": [], "price_tier": "", "dietary": [], "ambiance": [], "sort_preference": "", "city": (user.city or "").strip()}
    return {
        "cuisines": [c.strip() for c in (getattr(row, "cuisines", None) or [])],
        "price_tier": _normalize_price(getattr(row, "price_range", "") or ""),
        "dietary": [d.strip() for d in (getattr(row, "dietary_needs", None) or [])],
        "ambiance": [a.strip() for a in (getattr(row, "ambiance_preferences", None) or [])],
        "sort_preference": (getattr(row, "sort_preference", "") or "").strip(),
        "city": (user.city or "").strip(),
    }

def _db_options(db: Session):
    rows = db.query(Restaurant).all()
    cuisines = sorted({(r.cuisine_type or "").strip() for r in rows if r.cuisine_type})
    cities = sorted({(r.city or "").strip() for r in rows if r.city})
    return cuisines, cities

BEST_RATING_PHRASES = [
    "best review", "best rated", "highest rated", "best rating",
    "highest rating", "top rated", "which one is best",
]
MOST_REVIEWS_PHRASES = [
    "most reviews", "most reviewed", "most popular",
]
PICK_ONE_PHRASES = [
    "which one", "which is better", "pick one", "recommend one",
    "which should i", "which would you",
]

def _is_simple_followup(message: str, history: str) -> bool:
    """Only trigger for direct comparison questions with no new city/cuisine."""
    if not history:
        return False
    lowered = _norm(message)
    all_phrases = BEST_RATING_PHRASES + MOST_REVIEWS_PHRASES + PICK_ONE_PHRASES
    return any(p in lowered for p in all_phrases)

def _answer_followup(message: str, history: str) -> Optional[str]:
    """Answer directly from the most recent assistant reply in history."""
    lowered = _norm(message)

    last_reply_lines = []
    in_last_assistant = False
    for line in history.split("\n"):
        if line.startswith("Assistant:"):
            last_reply_lines = [line[len("Assistant:"):].strip()]
            in_last_assistant = True
        elif line.startswith("User:"):
            in_last_assistant = False
        elif in_last_assistant:
            last_reply_lines.append(line)
    last_reply = " ".join(last_reply_lines).strip()
    if not last_reply:
        last_reply = history

    name_rating = re.findall(r"([\w][\w\s&']+?)\s*\(([\d.]+)[★*]", last_reply)
    if not name_rating:
        name_rating = re.findall(r"([\w][\w\s&']{2,40})\s+([\d.]+)\s*[★*]", last_reply)
    if not name_rating:
        return None

    if any(p in lowered for p in BEST_RATING_PHRASES):
        best = max(name_rating, key=lambda x: float(x[1]))
        return f"{best[0].strip()} has the best rating at {best[1]}★. Would you like more details?"

    if any(p in lowered for p in MOST_REVIEWS_PHRASES):
        names = [n.strip() for n, _ in name_rating]
        return f"From the options shown: {", ".join(names[:3])}. I'd need full details to compare review counts."

    if any(p in lowered for p in PICK_ONE_PHRASES):
        top_name, top_rating = name_rating[0]
        return f"I'd go with {top_name.strip()} ({top_rating}★) — it ranked highest in your search."

    return None

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
        pref_cuisines = [c for c in prefs["cuisines"] if c]
        cuisine = pref_cuisines[0] if len(pref_cuisines) == 1 else None

    city = next((c for c in sorted(cities, key=len, reverse=True) if c and _norm(c) in msg), None)
    if not city and any(p in msg for p in ["near me", "nearby", "closest", "around me"]):
        user_city = prefs.get("city", "")
        if user_city:
            city = next((c for c in cities if _norm(c) == _norm(user_city)), user_city)

    price_tier = next(
        (tier for tier, aliases in PRICE_MAP.items() if any(_norm(a) in msg for a in aliases)),
        None,
    )
    if not price_tier and prefs.get("price_tier"):
        price_tier = prefs["price_tier"]

    min_rating = None
    m = re.search(r"(?:at least|min(?:imum)?|above|over)\s*(\d(?:\.\d)?)", msg)
    if m:
        min_rating = max(0.0, min(5.0, float(m.group(1))))
    elif any(w in msg for w in ("top rated", "top-rated")):
        min_rating = 4.0

    wants_options = any(p in msg for p in ["what cuisines", "available cuisines", "what cities", "list options"])
    wants_web = any(p in msg for p in ["open now", "hours", "events", "trending", "tonight", "this weekend"])

    msg_ambiance = [a for a in AMBIANCE_KW if _norm(a) in full]
    msg_dietary  = [d for d in DIETARY_KW  if _norm(d) in full]
    merged_ambiance = list(dict.fromkeys(prefs.get("ambiance", []) + msg_ambiance))
    merged_dietary  = list(dict.fromkeys(prefs.get("dietary",  []) + msg_dietary))

    return ParsedQuery(
        cuisine=cuisine,
        city=city,
        price_tier=price_tier,
        dietary=merged_dietary,
        ambiance=merged_ambiance,
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
            "prefs": json.dumps(prefs),
            "cuisines": ", ".join(cuisines),
            "cities": ", ".join(cities),
            "history": history or "None",
            "message": message,
            "fmt": parser.get_format_instructions(),
        })
        parsed = parser.parse(getattr(raw, "content", ""))
        if not parsed.cuisine and prefs.get("cuisines"):
            parsed.cuisine = prefs["cuisines"][0]
        if parsed.price_tier:
            parsed.price_tier = _normalize_price(parsed.price_tier)
        return parsed
    except Exception:
        return _heuristic_parse(message, history, prefs, cuisines, cities)

def _search(db: Session, q: ParsedQuery, limit: int = 40, pref_cuisines: List[str] = None) -> List[Restaurant]:
    from sqlalchemy import or_
    query = db.query(Restaurant)
    if q.cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{q.cuisine}%"))
    elif pref_cuisines and len(pref_cuisines) > 1:
        query = query.filter(or_(*[Restaurant.cuisine_type.ilike(f"%{c}%") for c in pref_cuisines]))
    if q.city: query = query.filter(Restaurant.city.ilike(f"%{q.city}%"))
    if q.min_rating: query = query.filter(Restaurant.avg_rating >= q.min_rating)
    return query.limit(limit).all()

def _score(r: Restaurant, q: ParsedQuery, prefs: Dict, pref_cuisines: List[str] = None) -> float:
    blob = _norm(" ".join(filter(None, [
        r.name, r.cuisine_type, r.city,
        getattr(r, "address", ""), getattr(r, "description", ""),
    ])))
    rating = float(r.avg_rating or 0)
    reviews = int(r.review_count or 0)
    r_price = (getattr(r, "price_tier", "") or "") if hasattr(Restaurant, "price_tier") else ""

    score = rating * 20 + min(reviews, 200) * 0.05

    if q.cuisine and r.cuisine_type and q.cuisine.lower() in r.cuisine_type.lower():
        score += 30
    elif not q.cuisine and r.cuisine_type and pref_cuisines:
        if any(c.lower() in r.cuisine_type.lower() for c in pref_cuisines):
            score += 25
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
    if sort == "rating": score += rating * 3
    elif sort == "popularity": score += min(reviews, 300) * 0.05

    return score

def _rank(restaurants: List[Restaurant], q: ParsedQuery, prefs: Dict, pref_cuisines: List[str] = None) -> List[Restaurant]:
    return sorted(
        restaurants,
        key=lambda r: (_score(r, q, prefs, pref_cuisines), float(r.avg_rating or 0)),
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

def _build_reply(q: ParsedQuery, ranked: List[Restaurant], web_note: str, prefs: Dict = None) -> str:
    if not ranked:
        msg = "I couldn't find a strong match. Try broadening your cuisine, city, price, or rating."
        return f"{msg}\n\n{web_note}" if web_note else msg

    details_parts = []
    if q.cuisine:
        details_parts.append(q.cuisine)
    elif prefs and prefs.get("cuisines"):
        details_parts.append(f"your preferences ({', '.join(prefs['cuisines'])})")
    if q.city:
        details_parts.append(f"in {q.city}")
    if q.occasion:
        details_parts.append(f"for {q.occasion}")
    if q.price_tier and prefs and _normalize_price(prefs.get("price_tier", "")) == q.price_tier:
        details_parts.append(f"within your {q.price_tier} budget")
    if prefs and prefs.get("ambiance"):
        details_parts.append(f"{', '.join(prefs['ambiance'])} ambiance")

    details = " ".join(details_parts)
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

def _save_chat(db: Session, user_id: int, session_id: str, history: list, user_message: str, assistant_reply: str):
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_message})
    messages.append({"role": "assistant", "content": assistant_reply})
    existing = db.query(AIChat).filter(AIChat.session_id == session_id).first()
    if existing:
        existing.messages_json = messages
    else:
        db.add(AIChat(user_id=user_id, session_id=session_id, messages_json=messages))
    db.commit()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = (request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session_id = (request.session_id or "").strip() or str(uuid.uuid4())

    prefs = _load_prefs(db, current_user)
    cuisines, cities = _db_options(db)
    history = "\n".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in (request.conversation_history or [])[-8:]
    )

    msg_lower = _norm(message)
    has_new_cuisine = any(c.lower() in msg_lower for c in cuisines if c) or any(kw in msg_lower for kw in CUISINE_KW)
    has_new_city = any(c.lower() in msg_lower for c in cities if c)
    if not (has_new_cuisine and has_new_city) and _is_simple_followup(message, history):
        answer = _answer_followup(message, history)
        if answer:
            return ChatResponse(reply=answer, restaurants=[])

    parsed = _parse_query(message, history, prefs, cuisines, cities)

    if parsed.wants_options:
        reply = (
            f"Available cuisines: {', '.join(cuisines) or 'None found'}\n"
            f"Available cities: {', '.join(cities) or 'None found'}"
        )
        _save_chat(db, current_user.user_id, session_id, request.conversation_history or [], message, reply)
        return ChatResponse(reply=reply, restaurants=[])

    candidates = _search(db, parsed, pref_cuisines=prefs.get("cuisines", []))
    ranked = _rank(candidates, parsed, prefs, pref_cuisines=prefs.get("cuisines", []))

    web_note = ""
    if parsed.wants_web:
        web_note = _tavily(" ".join(filter(None, [message, parsed.city, parsed.cuisine])))

    reply = _build_reply(parsed, ranked[:5], web_note, prefs)
    _save_chat(db, current_user.user_id, session_id, request.conversation_history or [], message, reply)

    return ChatResponse(
        reply=reply,
        restaurants=_to_cards(ranked),
    )