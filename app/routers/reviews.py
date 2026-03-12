"""
POST /restaurants/{id}/reviews
PUT /reviews/{id}
DELETE /reviews/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Review, Restaurant, User
from app.schemas import ReviewCreateIn, ReviewUpdateIn, ReviewOut
from app.deps import get_current_user

router = APIRouter(tags=["reviews"])


@router.get("/restaurants/{restaurant_id}/reviews", response_model=list[ReviewOut])
def list_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.review_date.desc())
        .all()
    )


@router.post("/restaurants/{restaurant_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    restaurant_id: int,
    body: ReviewCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")

    review = Review(
        restaurant_id=restaurant_id,
        user_id=current_user.user_id,
        rating=body.rating,
        comment=body.comment,
        photos=body.photos,
    )
    db.add(review)

    # update stored aggregates (simple approach)
    r.review_count += 1
    r.avg_rating = ((r.avg_rating * (r.review_count - 1)) + body.rating) / r.review_count

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
        raise HTTPException(404, detail="Review not found")
    if review.user_id != current_user.user_id:
        raise HTTPException(403, detail="You can only edit your own reviews")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(review, k, v)

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
        raise HTTPException(404, detail="Review not found")
    if review.user_id != current_user.user_id:
        raise HTTPException(403, detail="You can only delete your own reviews")

    db.delete(review)
    db.commit()
    return None
