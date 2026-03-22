from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db import get_db
from app.models import Review, Restaurant, User
from app.schemas import ReviewCreateIn, ReviewUpdateIn, ReviewOut
from app.deps import get_current_user

router = APIRouter(tags=["reviews"])


def refresh_restaurant_rating(db: Session, restaurant_id: int) -> None:
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if not restaurant:
        return

    review_count = (
        db.query(func.count(Review.review_id))
        .filter(Review.restaurant_id == restaurant_id)
        .scalar()
    )

    avg_rating = (
        db.query(func.avg(Review.rating))
        .filter(Review.restaurant_id == restaurant_id)
        .scalar()
    )

    restaurant.review_count = review_count or 0
    restaurant.avg_rating = float(avg_rating) if avg_rating is not None else 0.0


@router.get("/restaurants/{restaurant_id}/reviews", response_model=list[ReviewOut])
def list_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    return (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.review_date.desc())
        .all()
    )


@router.post(
    "/restaurants/{restaurant_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    restaurant_id: int,
    body: ReviewCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    review = Review(
        restaurant_id=restaurant_id,
        user_id=current_user.user_id,
        rating=body.rating,
        comment=body.comment,
        photos=body.photos,
        review_date=datetime.now(timezone.utc),
    )

    db.add(review)
    db.flush()

    refresh_restaurant_rating(db, restaurant_id)

    db.commit()
    db.refresh(review)
    return review


@router.put("/reviews/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    body: ReviewUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.review_id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own reviews",
        )

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(review, key, value)

    db.flush()

    refresh_restaurant_rating(db, review.restaurant_id)

    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.review_id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own reviews",
        )

    restaurant_id = review.restaurant_id

    db.delete(review)
    db.flush()

    refresh_restaurant_rating(db, restaurant_id)

    db.commit()
    return None