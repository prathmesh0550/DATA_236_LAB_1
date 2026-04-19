from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING
from pymongo.database import Database

from app.db import get_db
from app.deps import get_current_owner

router = APIRouter(prefix="/owners", tags=["owners"])


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid ID") from exc


def serialize_date(val):
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return val.isoformat()


def serialize_restaurant(doc: dict) -> dict:
    return {
        "restaurant_id": str(doc["_id"]),
        "name": doc.get("name"),
        "cuisine_type": doc.get("cuisine_type"),
        "city": doc.get("city"),
        "zip_code": doc.get("zip_code"),
        "address": doc.get("address"),
        "description": doc.get("description"),
        "hours": doc.get("hours"),
        "contact_info": doc.get("contact_info"),
        "price_tier": doc.get("price_tier"),
        "avg_rating": float(doc.get("avg_rating", 0.0) or 0.0),
        "review_count": int(doc.get("review_count", 0) or 0),
        "photos": doc.get("photos", []),
        "claimed_by_owner_id": str(doc["claimed_by_owner_id"]) if doc.get("claimed_by_owner_id") else None,
        "created_by_user_id": str(doc["created_by_user_id"]) if doc.get("created_by_user_id") else None,
        "created_at": doc.get("created_at"),
    }


@router.post("/restaurants/{restaurant_id}/claim")
def claim_restaurant(
    restaurant_id: str,
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    restaurant_oid = oid(restaurant_id)
    r = db["restaurants"].find_one({"_id": restaurant_oid})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    claimed_by = r.get("claimed_by_owner_id")
    if claimed_by and claimed_by != current_owner["_id"]:
        raise HTTPException(status_code=403, detail="Restaurant already claimed by another owner")

    db["restaurants"].update_one(
        {"_id": restaurant_oid},
        {"$set": {"claimed_by_owner_id": current_owner["_id"]}},
    )

    return {
        "ok": True,
        "restaurant_id": restaurant_id,
        "claimed_by_owner_id": str(current_owner["_id"]),
    }


@router.get("/me/restaurants")
def my_restaurants(
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    restaurants = list(
        db["restaurants"].find({"claimed_by_owner_id": current_owner["_id"]})
    )
    return [serialize_restaurant(r) for r in restaurants]


@router.get("/me/restaurants/{restaurant_id}/reviews")
def my_restaurant_reviews(
    restaurant_id: str,
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    restaurant_oid = oid(restaurant_id)

    r = db["restaurants"].find_one({"_id": restaurant_oid})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.get("claimed_by_owner_id") != current_owner["_id"]:
        raise HTTPException(status_code=403, detail="You can only view reviews for your claimed restaurants")

    reviews = list(
        db["reviews"]
        .find({"restaurant_id": restaurant_oid})
        .sort("review_date", DESCENDING)
    )

    return [
        {
            "review_id": str(rv["_id"]),
            "restaurant_id": str(rv["restaurant_id"]),
            "user_id": str(rv["user_id"]),
            "rating": rv["rating"],
            "comment": rv.get("comment"),
            "review_date": serialize_date(rv.get("review_date")),
            "photos": rv.get("photos", []),
        }
        for rv in reviews
    ]


@router.get("/me/dashboard")
def dashboard(
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    restaurants = list(
        db["restaurants"].find({"claimed_by_owner_id": current_owner["_id"]})
    )
    restaurant_ids = [r["_id"] for r in restaurants]
    restaurant_name_map = {str(r["_id"]): r.get("name", "Unknown") for r in restaurants}

    if not restaurant_ids:
        return {
            "restaurant_count": 0,
            "total_reviews": 0,
            "avg_rating_overall": 0.0,
            "recent_reviews": [],
        }

    reviews = list(
        db["reviews"]
        .find({"restaurant_id": {"$in": restaurant_ids}})
        .sort("review_date", DESCENDING)
    )

    total_reviews = len(reviews)
    avg_rating_overall = (
        sum(r["rating"] for r in reviews) / total_reviews
        if total_reviews > 0 else 0.0
    )

    recent_reviews = reviews[:10]

    return {
        "restaurant_count": len(restaurants),
        "total_reviews": total_reviews,
        "avg_rating_overall": float(avg_rating_overall),
        "recent_reviews": [
            {
                "review_id": str(rr["_id"]),
                "restaurant_id": str(rr["restaurant_id"]),
                "restaurant_name": restaurant_name_map.get(str(rr["restaurant_id"]), "Unknown"),
                "user_id": str(rr["user_id"]),
                "rating": rr["rating"],
                "comment": rr.get("comment"),
                "review_date": serialize_date(rr.get("review_date")),
            }
            for rr in recent_reviews
        ],
    }