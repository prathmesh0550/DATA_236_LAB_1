from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- AUTH ----------
class UserSignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class UserLoginIn(BaseModel):
    email: EmailStr
    password: str

class OwnerSignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    restaurant_location: Optional[str] = None

class OwnerLoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class OwnerOut(BaseModel):
    owner_id: int
    name: str
    email: EmailStr
    restaurant_location: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- USER PROFILE ----------
class UserProfileOut(BaseModel):
    user_id: int
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

    class Config:
        from_attributes = True

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
    profile_picture: str  # URL or path


# ---------- PREFERENCES ----------
class PreferencesOut(BaseModel):
    cuisines: Optional[List[str]] = None
    price_range: Optional[str] = None
    dietary_needs: Optional[List[str]] = None
    search_radius: Optional[int] = None
    ambiance_preferences: Optional[List[str]] = None
    sort_preference: Optional[str] = None

    class Config:
        from_attributes = True

class PreferencesIn(PreferencesOut):
    pass


# ---------- RESTAURANTS ----------
class RestaurantCreateIn(BaseModel):
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    zip: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price: Optional[str] = None
    amenities: Optional[List[str]] = None
    photos: Optional[List[str]] = None

class RestaurantUpdateIn(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    zip: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price: Optional[str] = None
    amenities: Optional[List[str]] = None
    photos: Optional[List[str]] = None

class RestaurantOut(BaseModel):
    restaurant_id: int
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    zip: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    contact_info: Optional[str] = None
    price: Optional[str] = None
    amenities: Optional[List[str]] = None
    avg_rating: float
    review_count: int
    photos: Optional[List[str]] = None
    claimed_by_owner_id: Optional[int] = None
    created_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True

class RestaurantCardOut(BaseModel):
    restaurant_id: int
    name: str
    cuisine_type: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    avg_rating: float
    review_count: int
    photos: Optional[List[str]] = None

    class Config:
        from_attributes = True

class AddPhotosIn(BaseModel):
    photos: List[str]


# ---------- REVIEWS ----------
class ReviewCreateIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    photos: Optional[List[str]] = None

class ReviewUpdateIn(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None
    photos: Optional[List[str]] = None

class ReviewOut(BaseModel):
    review_id: int
    restaurant_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    review_date: str
    photos: Optional[List[str]] = None

    class Config:
        from_attributes = True
