from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


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


class OwnerOut(BaseModel):
    owner_id: str
    name: str
    email: EmailStr
    restaurant_location: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)