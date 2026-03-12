"""
GET /users/me
PUT /users/me
GET /users/me/preferences
PUT /users/me/preferences
GET /users/me/history
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, UserPreference, Restaurant, Review
from app.schemas import (
    UserProfileOut, UserProfileUpdateIn, ProfilePictureIn,
    PreferencesOut, PreferencesIn
)
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

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(pref, k, v)

    db.commit()
    db.refresh(pref)
    return pref


@router.get("/me/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.user_id)
        .order_by(Review.review_date.desc())
        .all()
    )
    restaurants = (
        db.query(Restaurant)
        .filter(Restaurant.created_by_user_id == current_user.user_id)
        .order_by(Restaurant.created_at.desc())
        .all()
    )

    return {
        "reviews": [
            {
                "review_id": r.review_id,
                "restaurant_id": r.restaurant_id,
                "rating": r.rating,
                "comment": r.comment,
                "review_date": r.review_date.isoformat(),
            }
            for r in reviews
        ],
        "restaurants_created": [
            {
                "restaurant_id": x.restaurant_id,
                "name": x.name,
                "created_at": x.created_at.isoformat(),
            }
            for x in restaurants
        ],
    }
