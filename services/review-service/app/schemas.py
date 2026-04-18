from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ReviewCreateIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    photos: Optional[List[str]] = None


class ReviewUpdateIn(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None
    photos: Optional[List[str]] = None


class ReviewOut(BaseModel):
    review_id: str
    restaurant_id: str
    user_id: str
    rating: int
    comment: Optional[str] = None
    review_date: datetime
    photos: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


class UserHistoryReviewOut(BaseModel):
    review_id: str
    restaurant_id: str
    restaurant_name: str
    rating: int
    comment: str | None = None
    review_date: datetime

    model_config = ConfigDict(from_attributes=True)


class UserHistoryRestaurantOut(BaseModel):
    restaurant_id: str
    name: str
    cuisine_type: str | None = None
    city: str | None = None
    price_tier: str | None = None
    avg_rating: float | None = 0.0
    review_count: int | None = 0
    photos: list[str] = []
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserHistoryOut(BaseModel):
    reviews: list[UserHistoryReviewOut]
    restaurants_added: list[UserHistoryRestaurantOut]