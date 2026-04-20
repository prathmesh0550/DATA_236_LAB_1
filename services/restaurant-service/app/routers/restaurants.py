from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import DESCENDING
from pymongo.database import Database

from app.db import get_db
from app.schemas import RestaurantCardOut, RestaurantOut, RestaurantCreateIn, RestaurantUpdateIn, AddPhotosIn
from app.deps import get_current_user, get_current_owner
from app.kafka_producer import kafka_send

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid ID") from exc


def serialize_restaurant(doc: dict) -> dict:
    return {
        "restaurant_id": str(doc["_id"]) if doc.get("_id") else doc.get("restaurant_id", "pending"),
        "name": doc.get("name"),
        "cuisine_type": doc.get("cuisine_type"),
        "city": doc.get("city"),
        "zip_code": doc.get("zip_code"),
        "address": doc.get("address"),
        "description": doc.get("description"),
        "hours": doc.get("hours"),
        "contact_info": doc.get("contact_info"),
        "price_tier": doc.get("price_tier"),
        "photos": doc.get("photos", []),
        "avg_rating": float(doc.get("avg_rating", 0.0) or 0.0),
        "review_count": int(doc.get("review_count", 0) or 0),
        "created_by_user_id": str(doc["created_by_user_id"]) if doc.get("created_by_user_id") else None,
        "claimed_by_owner_id": str(doc["claimed_by_owner_id"]) if doc.get("claimed_by_owner_id") else None,
        "created_at": doc.get("created_at"),
    }


@router.get("", response_model=list[RestaurantCardOut])
def search_restaurants(
    db: Database = Depends(get_db),
    name: str | None = Query(default=None),
    cuisine: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    city: str | None = Query(default=None),
    zip_code: str | None = Query(default=None),
    price: str | None = Query(default=None),
    sort: str | None = Query(default="rating"),
):
    mongo_query: dict = {}
    if name:
        mongo_query["name"] = {"$regex": name, "$options": "i"}
    if city:
        mongo_query["city"] = {"$regex": city, "$options": "i"}
    if zip_code:
        mongo_query["zip_code"] = {"$regex": zip_code, "$options": "i"}
    if price:
        mongo_query["price_tier"] = price
    if cuisine or keyword:
        search_term = cuisine or keyword
        mongo_query["$or"] = [
            {"cuisine_type": {"$regex": search_term, "$options": "i"}},
            {"name": {"$regex": search_term, "$options": "i"}},
            {"description": {"$regex": search_term, "$options": "i"}},
            {"contact_info": {"$regex": search_term, "$options": "i"}},
        ]
    sort_field = "avg_rating"
    if sort == "new":
        sort_field = "created_at"
    elif sort == "reviews":
        sort_field = "review_count"
    docs = list(db["restaurants"].find(mongo_query).sort(sort_field, DESCENDING).limit(100))
    return [serialize_restaurant(doc) for doc in docs]


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: str, db: Database = Depends(get_db)):
    r = db["restaurants"].find_one({"_id": oid(restaurant_id)})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return serialize_restaurant(r)


@router.post("", response_model=RestaurantOut)
def create_restaurant(
    body: RestaurantCreateIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    created_at = datetime.now(timezone.utc)
    event = {
        "name": body.name,
        "cuisine_type": body.cuisine_type,
        "city": body.city,
        "zip_code": body.zip_code,
        "address": body.address,
        "description": body.description,
        "hours": body.hours,
        "contact_info": body.contact_info,
        "price_tier": body.price_tier,
        "created_by_user_id": str(current_user["_id"]),
        "claimed_by_owner_id": None,
        "photos": body.photos or [],
        "created_at": created_at.isoformat(),
    }
    kafka_send("restaurant.created", event)

    return {
        "restaurant_id": "pending",
        "name": body.name,
        "cuisine_type": body.cuisine_type,
        "city": body.city,
        "zip_code": body.zip_code,
        "address": body.address,
        "description": body.description,
        "hours": body.hours,
        "contact_info": body.contact_info,
        "price_tier": body.price_tier,
        "photos": body.photos or [],
        "avg_rating": 0.0,
        "review_count": 0,
        "created_by_user_id": str(current_user["_id"]),
        "claimed_by_owner_id": None,
        "created_at": created_at,
    }


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant_owner_only(
    restaurant_id: str,
    body: RestaurantUpdateIn,
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    r = db["restaurants"].find_one({"_id": oid(restaurant_id)})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.get("claimed_by_owner_id") != current_owner["_id"]:
        raise HTTPException(status_code=403, detail="You can only update restaurants you claimed")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        return serialize_restaurant(r)

    kafka_send("restaurant.updated", {
        "restaurant_id": restaurant_id,
        "owner_id": str(current_owner["_id"]),
        "updates": updates,
    })

    preview = r.copy()
    preview.update(updates)
    return serialize_restaurant(preview)


@router.post("/{restaurant_id}/photos", response_model=RestaurantOut)
def add_photos(
    restaurant_id: str,
    body: AddPhotosIn,
    db: Database = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    r = db["restaurants"].find_one({"_id": oid(restaurant_id)})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.get("claimed_by_owner_id") != current_owner["_id"]:
        raise HTTPException(status_code=403, detail="You can only add photos to restaurants you claimed")

    updated_photos = r.get("photos", []) + body.photos
    kafka_send("restaurant.updated", {
        "restaurant_id": restaurant_id,
        "owner_id": str(current_owner["_id"]),
        "updates": {"photos": updated_photos},
    })

    preview = r.copy()
    preview["photos"] = updated_photos
    return serialize_restaurant(preview)