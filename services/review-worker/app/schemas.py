from typing import Optional, List
from pydantic import BaseModel


class ReviewCreatedEvent(BaseModel):
    restaurant_id: str
    user_id: str
    rating: int
    comment: Optional[str] = None
    photos: Optional[List[str]] = None


class ReviewUpdatedEvent(BaseModel):
    review_id: str
    rating: Optional[int] = None
    comment: Optional[str] = None
    photos: Optional[List[str]] = None


class ReviewDeletedEvent(BaseModel):
    review_id: str