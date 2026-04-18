from typing import Optional, List
from pydantic import BaseModel, EmailStr


class UserCreatedEvent(BaseModel):
    name: str
    email: EmailStr
    password_hash: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None
    about_me: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = None


class UserUpdatedEvent(BaseModel):
    user_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None
    about_me: Optional[str] = None
    languages: Optional[List[str]] = None
    gender: Optional[str] = None