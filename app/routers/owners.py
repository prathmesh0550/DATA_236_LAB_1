from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models import Owner, Restaurant, Review
from app.deps import get_current_owner

router = APIRouter(prefix="/owners", tags=["owners"])


@router.post("/restaurants/{restaurant_id}/claim")
def claim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")

    if r.claimed_by_owner_id and r.claimed_by_owner_id != current_owner.owner_id:
        raise HTTPException(403, detail="Restaurant already claimed by another owner")

    r.claimed_by_owner_id = current_owner.owner_id
    db.commit()
    return {"ok": True, "restaurant_id": restaurant_id, "claimed_by_owner_id": current_owner.owner_id}


@router.get("/me/restaurants")
def my_restaurants(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurants = db.query(Restaurant).filter(Restaurant.claimed_by_owner_id == current_owner.owner_id).all()
    return restaurants


@router.get("/me/restaurants/{restaurant_id}/reviews")
def my_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")
    if r.claimed_by_owner_id != current_owner.owner_id:
        raise HTTPException(403, detail="You can only view reviews for your claimed restaurants")

    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).order_by(Review.review_date.desc()).all()
    return reviews


@router.get("/me/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    # Basic analytics: counts + average rating across claimed restaurants
    restaurants = db.query(Restaurant).filter(Restaurant.claimed_by_owner_id == current_owner.owner_id).all()
    restaurant_ids = [r.restaurant_id for r in restaurants]

    if not restaurant_ids:
        return {
            "restaurant_count": 0,
            "total_reviews": 0,
            "avg_rating_overall": 0.0,
            "recent_reviews": [],
        }

    total_reviews = (
        db.query(func.count(Review.review_id))
        .filter(Review.restaurant_id.in_(restaurant_ids))
        .scalar()
    ) or 0

    avg_rating_overall = (
        db.query(func.avg(Review.rating))
        .filter(Review.restaurant_id.in_(restaurant_ids))
        .scalar()
    ) or 0.0

    recent_reviews = (
        db.query(Review)
        .filter(Review.restaurant_id.in_(restaurant_ids))
        .order_by(Review.review_date.desc())
        .limit(10)
        .all()
    )

    return {
        "restaurant_count": len(restaurants),
        "total_reviews": int(total_reviews),
        "avg_rating_overall": float(avg_rating_overall),
        "recent_reviews": [
            {
                "review_id": rr.review_id,
                "restaurant_id": rr.restaurant_id,
                "rating": rr.rating,
                "comment": rr.comment,
                "review_date": rr.review_date.isoformat(),
            }
            for rr in recent_reviews
        ],
    }
