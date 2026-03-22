from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, UserPreference, Restaurant, Review
from app.schemas import (UserProfileOut, UserProfileUpdateIn, ProfilePictureIn,
PreferencesOut, PreferencesIn, UserHistoryOut, UserHistoryRestaurantOut, UserHistoryReviewOut)
from app.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfileOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileOut)
def update_me(
    body: UserProfileUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/profile-picture", response_model=UserProfileOut)
def set_profile_picture(
    body: ProfilePictureIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.profile_picture = body.profile_picture
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/preferences", response_model=PreferencesOut)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.user_id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.user_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/me/preferences", response_model=PreferencesOut)
def upsert_preferences(
    body: PreferencesIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.user_id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.user_id)
        db.add(pref)

    data = body.model_dump(exclude_unset=True)

    if "cuisines" in data and data["cuisines"]:
        normalized = []
        for c in data["cuisines"]:
            normalized.extend([x.strip() for x in c.split(",") if x.strip()])
        data["cuisines"] = normalized

    for k, v in data.items():
        setattr(pref, k, v)

    db.commit()
    db.refresh(pref)
    return pref


@router.get("/me/history", response_model=UserHistoryOut)
def get_user_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review, Restaurant.name)
        .join(Restaurant, Restaurant.restaurant_id == Review.restaurant_id)
        .filter(Review.user_id == current_user.user_id)
        .order_by(Review.review_date.desc())
        .all()
    )

    restaurants_added = (
        db.query(Restaurant)
        .filter(Restaurant.created_by_user_id == current_user.user_id)
        .order_by(Restaurant.created_at.desc())
        .all()
    )

    review_items = [
        UserHistoryReviewOut(
            review_id=review.review_id,
            restaurant_id=review.restaurant_id,
            restaurant_name=restaurant_name,
            rating=review.rating,
            comment=review.comment,
            review_date=review.review_date,
        )
        for review, restaurant_name in reviews
    ]

    restaurant_items = [
        UserHistoryRestaurantOut(
            restaurant_id=r.restaurant_id,
            name=r.name,
            cuisine_type=r.cuisine_type,
            city=r.city,
            price_tier=r.price_tier,
            avg_rating=r.avg_rating,
            review_count=r.review_count,
            photos=r.photos if r.photos else [],
            created_at=r.created_at,
        )
        for r in restaurants_added
    ]

    return UserHistoryOut(
        reviews=review_items,
        restaurants_added=restaurant_items,
    )