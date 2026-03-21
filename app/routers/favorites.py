from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Favorite, Restaurant, User
from app.schemas import RestaurantCardOut
from app.deps import get_current_user

router = APIRouter(prefix="", tags=["favorites"])


@router.post("/favorites/{restaurant_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")

    exists = db.query(Favorite).filter(
        Favorite.user_id == current_user.user_id,
        Favorite.restaurant_id == restaurant_id
    ).first()
    if exists:
        return {"restaurant_id": restaurant_id, "favorited": True}

    fav = Favorite(user_id=current_user.user_id, restaurant_id=restaurant_id)
    db.add(fav)
    db.commit()
    return {"restaurant_id": restaurant_id, "favorited": True}


@router.delete("/favorites/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.user_id,
        Favorite.restaurant_id == restaurant_id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return None


@router.get("/users/me/favorites", response_model=list[RestaurantCardOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Restaurant)
        .join(Favorite, Favorite.restaurant_id == Restaurant.restaurant_id)
        .filter(Favorite.user_id == current_user.user_id)
        .all()
    )
