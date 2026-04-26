from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.db import get_db
from app.schemas import ReviewCreateIn, ReviewUpdateIn, ReviewOut
from app.deps import get_current_user
from app.kafka_producer import kafka_send

router = APIRouter(tags=["reviews"])


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid ID") from exc


def serialize_review(doc: dict) -> dict:
    return {
        "review_id": str(doc["_id"]) if doc.get("_id") else doc.get("review_id", "pending"),
        "restaurant_id": str(doc["restaurant_id"]) if doc.get("restaurant_id") else None,
        "user_id": str(doc["user_id"]) if doc.get("user_id") else None,
        "rating": doc.get("rating"),
        "comment": doc.get("comment"),
        "photos": doc.get("photos", []),
        "review_date": doc.get("review_date"),
    }


@router.get("/restaurants/{restaurant_id}/reviews", response_model=list[ReviewOut])
def list_reviews(restaurant_id: str, db: Database = Depends(get_db)):
    restaurant_oid = oid(restaurant_id)
    restaurant = db["restaurants"].find_one({"_id": restaurant_oid})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_oid}).sort("review_date", -1))
    return [serialize_review(r) for r in reviews]


def refresh_restaurant_rating(db: Database, restaurant_oid: ObjectId) -> None:
    pipeline = [
        {"$match": {"restaurant_id": restaurant_oid}},
        {"$group": {"_id": "$restaurant_id", "review_count": {"$sum": 1}, "avg_rating": {"$avg": "$rating"}}},
    ]
    agg = list(db["reviews"].aggregate(pipeline))
    if not agg:
        db["restaurants"].update_one({"_id": restaurant_oid}, {"$set": {"review_count": 0, "avg_rating": 0.0}})
        return
    stats = agg[0]
    db["restaurants"].update_one(
        {"_id": restaurant_oid},
        {"$set": {"review_count": int(stats["review_count"]), "avg_rating": float(stats["avg_rating"])}},
    )


@router.post("/restaurants/{restaurant_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    restaurant_id: str,
    body: ReviewCreateIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    restaurant_oid = oid(restaurant_id)
    restaurant = db["restaurants"].find_one({"_id": restaurant_oid})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    review_date = datetime.now(timezone.utc)
    new_id = ObjectId()
    doc = {
        "_id": new_id,
        "restaurant_id": restaurant_oid,
        "user_id": current_user["_id"],
        "rating": body.rating,
        "comment": body.comment,
        "photos": body.photos or [],
        "review_date": review_date,
    }
    db["reviews"].insert_one(doc)
    refresh_restaurant_rating(db, restaurant_oid)

    # Kafka event carries metadata only — photos excluded to stay within broker size limits.
    # Worker uses upsert so it's a no-op if the document already exists.
    kafka_send("review.created", {
        "review_id": str(new_id),
        "restaurant_id": str(restaurant_oid),
        "user_id": str(current_user["_id"]),
        "rating": body.rating,
        "comment": body.comment,
        "photos": [],
        "review_date": review_date.isoformat(),
    })

    return {
        "review_id": str(new_id),
        "restaurant_id": str(restaurant_oid),
        "user_id": str(current_user["_id"]),
        "rating": body.rating,
        "comment": body.comment,
        "photos": body.photos or [],
        "review_date": review_date,
    }


@router.put("/reviews/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: str,
    body: ReviewUpdateIn,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"_id": oid(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        return serialize_review(review)

    event = {
        "review_id": review_id,
        "user_id": str(current_user["_id"]),
        "restaurant_id": str(review["restaurant_id"]),
        "updates": updates,
    }
    kafka_send("review.updated", event)

    preview = review.copy()
    preview.update(updates)
    return serialize_review(preview)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"_id": oid(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")

    kafka_send("review.deleted", {
        "review_id": review_id,
        "user_id": str(current_user["_id"]),
        "restaurant_id": str(review["restaurant_id"]),
    })
    return None