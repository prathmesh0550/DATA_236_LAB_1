from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserSignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserLoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    user_id: str
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserProfileOut(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None
    about_me: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    about_me: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = None


class ProfilePictureIn(BaseModel):
    profile_picture: str


class PreferencesOut(BaseModel):
    cuisines: Optional[List[str]] = None
    price_range: Optional[str] = None
    dietary_needs: Optional[List[str]] = None
    search_radius: Optional[int] = None
    ambiance_preferences: Optional[List[str]] = None
    sort_preference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PreferencesIn(PreferencesOut):
    pass


class RestaurantCard(BaseModel):
    restaurant_id: str
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: Optional[int] = None
    price_tier: Optional[str] = None
    photos: Optional[List[str]] = None


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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    restaurants: List[RestaurantCard] = []

class RestaurantCard(BaseModel):
    restaurant_id: str
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: Optional[int] = None
    price_tier: Optional[str] = None
    photos: Optional[List[str]] = None


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