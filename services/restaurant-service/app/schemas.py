from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class RestaurantCreateIn(BaseModel):
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price_tier: Optional[str] = None
    photos: Optional[List[str]] = None


class RestaurantUpdateIn(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price_tier: Optional[str] = None
    photos: Optional[List[str]] = None


class RestaurantOut(BaseModel):
    restaurant_id: str
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price_tier: Optional[str] = None
    avg_rating: float
    review_count: int
    photos: Optional[List[str]] = None
    claimed_by_owner_id: Optional[str] = None
    created_by_user_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RestaurantCardOut(BaseModel):
    restaurant_id: str
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: Optional[int] = None
    price_tier: Optional[str] = None
    photos: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


class AddPhotosIn(BaseModel):
    photos: List[str]