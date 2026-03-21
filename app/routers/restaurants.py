from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import get_db
from app.models import Restaurant, User
from app.schemas import RestaurantCardOut, RestaurantOut, RestaurantCreateIn, RestaurantUpdateIn, AddPhotosIn
from app.deps import get_current_user, get_current_owner
from app.models import Owner

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=list[RestaurantCardOut])
def search_restaurants(
    db: Session = Depends(get_db),
    name: str | None = Query(default=None),
    cuisine: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    city: str | None = Query(default=None),
    zip: str | None = Query(default=None),
    price: str | None = Query(default=None),
    sort: str | None = Query(default="rating"),
):
    q = db.query(Restaurant)

    if name:
        q = q.filter(Restaurant.name.ilike(f"%{name}%"))
    if cuisine:
        q = q.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    if city:
        q = q.filter(Restaurant.city.ilike(f"%{city}%"))
    if zip:
        q = q.filter(Restaurant.zip.ilike(f"%{zip}%"))
    if price:
        q = q.filter(Restaurant.price_tier == price)  # fixed: was Restaurant.price
    if keyword:
        q = q.filter(or_(
            Restaurant.name.ilike(f"%{keyword}%"),
            Restaurant.description.ilike(f"%{keyword}%"),
            Restaurant.contact_info.ilike(f"%{keyword}%"),
        ))

    if sort == "new":
        q = q.order_by(Restaurant.created_at.desc())
    elif sort == "reviews":
        q = q.order_by(Restaurant.review_count.desc())
    else:
        q = q.order_by(Restaurant.avg_rating.desc())

    return q.limit(100).all()


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")
    return r


@router.post("/restaurants")
def create_restaurant(
    body: RestaurantCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = Restaurant(
        name=body.name,
        cuisine_type=body.cuisine_type,
        city=body.city,
        address=body.address,
        description=body.description,
        hours=body.hours,
        contact_info=body.contact_info,
        price_tier=body.price_tier,       # fixed: was missing
        created_by_user_id=current_user.user_id,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant_owner_only(
    restaurant_id: int,
    body: RestaurantUpdateIn,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")
    if r.claimed_by_owner_id != current_owner.owner_id:
        raise HTTPException(403, detail="You can only update restaurants you claimed")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(r, k, v)

    db.commit()
    db.refresh(r)
    return r


@router.post("/{restaurant_id}/photos", response_model=RestaurantOut)
def add_photos(
    restaurant_id: int,
    body: AddPhotosIn,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    r = db.query(Restaurant).filter(Restaurant.restaurant_id == restaurant_id).first()
    if not r:
        raise HTTPException(404, detail="Restaurant not found")
    if r.claimed_by_owner_id != current_owner.owner_id:
        raise HTTPException(403, detail="You can only add photos to restaurants you claimed")

    existing = r.photos or []
    r.photos = existing + body.photos

    db.commit()
    db.refresh(r)
    return r