from typing import Optional, List
from pydantic import BaseModel


class RestaurantCreatedEvent(BaseModel):
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
    created_by_user_id: Optional[str] = None


class RestaurantUpdatedEvent(BaseModel):
    restaurant_id: str
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


class RestaurantClaimedEvent(BaseModel):
    restaurant_id: str
    owner_id: str