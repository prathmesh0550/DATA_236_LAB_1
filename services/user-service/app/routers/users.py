from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pymongo import DESCENDING
from pymongo.database import Database

from app.db import get_db
from app.schemas import (
    UserProfileOut,
    UserProfileUpdateIn,
    ProfilePictureIn,
    PreferencesOut,
    PreferencesIn,
    UserHistoryOut,
    UserHistoryRestaurantOut,
    UserHistoryReviewOut,
)
from app.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


def serialize_user_profile(doc: dict) -> dict:
    return {
        "user_id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
        "phone": doc.get("phone"),
        "city": doc.get("city"),
        "state": doc.get("state"),
        "country": doc.get("country"),
        "profile_picture": doc.get("profile_picture"),
        "about_me": doc.get("about_me"),
        "languages": doc.get("languages", []),
        "gender": doc.get("gender"),
    }


@router.get("/me", response_model=UserProfileOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user_profile(current_user)


@router.put("/me", response_model=UserProfileOut)
def update_me(
    body: UserProfileUpdateIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    updates = body.model_dump(exclude_unset=True)
    if updates:
        db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$set": updates},
        )

    updated_user = db["users"].find_one({"_id": current_user["_id"]})
    return serialize_user_profile(updated_user)


@router.post("/me/profile-picture", response_model=UserProfileOut)
def set_profile_picture(
    body: ProfilePictureIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_picture": body.profile_picture}},
    )
    updated_user = db["users"].find_one({"_id": current_user["_id"]})
    return serialize_user_profile(updated_user)


@router.get("/me/preferences", response_model=PreferencesOut)
def get_preferences(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    pref = db["user_preferences"].find_one({"user_id": current_user["_id"]})
    if not pref:
        pref = {
            "user_id": current_user["_id"],
            "cuisines": [],
            "price_range": None,
            "dietary_needs": [],
            "search_radius": None,
            "ambiance_preferences": [],
            "sort_preference": None,
            "updated_at": datetime.now(timezone.utc),
        }
        db["user_preferences"].insert_one(pref)
    pref.pop("_id", None)
    pref.pop("user_id", None)
    return pref


@router.put("/me/preferences", response_model=PreferencesOut)
def upsert_preferences(
    body: PreferencesIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    data = body.model_dump(exclude_unset=True)

    if "cuisines" in data and data["cuisines"]:
        normalized = []
        for c in data["cuisines"]:
            normalized.extend([x.strip() for x in c.split(",") if x.strip()])
        data["cuisines"] = normalized

    data["updated_at"] = datetime.now(timezone.utc)

    db["user_preferences"].update_one(
        {"user_id": current_user["_id"]},
        {"$set": data, "$setOnInsert": {"user_id": current_user["_id"]}},
        upsert=True,
    )

    pref = db["user_preferences"].find_one({"user_id": current_user["_id"]})
    pref.pop("_id", None)
    pref.pop("user_id", None)
    return pref


@router.get("/me/history", response_model=UserHistoryOut)
def get_user_history(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reviews = list(
        db["reviews"]
        .find({"user_id": current_user["_id"]})
        .sort("review_date", DESCENDING)
    )

    restaurants_added = list(
        db["restaurants"]
        .find({"created_by_user_id": current_user["_id"]})
        .sort("created_at", DESCENDING)
    )

    restaurant_map = {
        str(r["_id"]): r.get("name", "Unknown Restaurant")
        for r in db["restaurants"].find(
            {"_id": {"$in": [rv["restaurant_id"] for rv in reviews]}}
        )
    } if reviews else {}

    review_items = [
        UserHistoryReviewOut(
            review_id=str(review["_id"]),
            restaurant_id=str(review["restaurant_id"]),
            restaurant_name=restaurant_map.get(str(review["restaurant_id"]), "Unknown Restaurant"),
            rating=review["rating"],
            comment=review.get("comment"),
            review_date=review["review_date"],
        )
        for review in reviews
    ]

    restaurant_items = [
        UserHistoryRestaurantOut(
            restaurant_id=str(r["_id"]),
            name=r.get("name"),
            cuisine_type=r.get("cuisine_type"),
            city=r.get("city"),
            price_tier=r.get("price_tier"),
            avg_rating=float(r.get("avg_rating", 0.0) or 0.0),
            review_count=int(r.get("review_count", 0) or 0),
            photos=r.get("photos", []),
            created_at=r.get("created_at"),
        )
        for r in restaurants_added
    ]

    return UserHistoryOut(
        reviews=review_items,
        restaurants_added=restaurant_items,
    )