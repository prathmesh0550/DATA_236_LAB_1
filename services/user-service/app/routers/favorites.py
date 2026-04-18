from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.db import get_db
from app.schemas import RestaurantCardOut
from app.deps import get_current_user

router = APIRouter(prefix="", tags=["favorites"])


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid ID") from exc


def serialize_restaurant_card(doc: dict) -> dict:
    return {
        "restaurant_id": str(doc["_id"]),
        "name": doc.get("name"),
        "cuisine_type": doc.get("cuisine_type"),
        "city": doc.get("city"),
        "zip_code": doc.get("zip_code"),
        "avg_rating": float(doc.get("avg_rating", 0.0) or 0.0),
        "review_count": int(doc.get("review_count", 0) or 0),
        "price_tier": doc.get("price_tier"),
        "photos": doc.get("photos", []),
    }


@router.post("/favorites/{restaurant_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    restaurant_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    restaurant_oid = oid(restaurant_id)

    r = db["restaurants"].find_one({"_id": restaurant_oid})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    exists = db["favorites"].find_one({
        "user_id": current_user["_id"],
        "restaurant_id": restaurant_oid,
    })
    if exists:
        return {"restaurant_id": restaurant_id, "favorited": True}

    db["favorites"].insert_one({
        "user_id": current_user["_id"],
        "restaurant_id": restaurant_oid,
    })
    return {"restaurant_id": restaurant_id, "favorited": True}


@router.delete("/favorites/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    restaurant_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db["favorites"].delete_one({
        "user_id": current_user["_id"],
        "restaurant_id": oid(restaurant_id),
    })
    return None


@router.get("/users/me/favorites", response_model=list[RestaurantCardOut])
def list_favorites(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    favs = list(db["favorites"].find({"user_id": current_user["_id"]}))
    restaurant_ids = [f["restaurant_id"] for f in favs]

    if not restaurant_ids:
        return []

    restaurants = list(db["restaurants"].find({"_id": {"$in": restaurant_ids}}))
    return [serialize_restaurant_card(r) for r in restaurants]