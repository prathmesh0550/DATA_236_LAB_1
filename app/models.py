# app/models.py
from __future__ import annotations

from datetime import datetime
from sqlalchemy import (Column, Integer, String, DateTime, ForeignKey, Text, Float, UniqueConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import JSON

from app.db import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(10), nullable=True)  # abbreviated
    country = Column(String(100), nullable=True)
    profile_picture = Column(String(500), nullable=True)  # URL or stored path
    about_me = Column(Text, nullable=True)
    # Store as JSON arrays (recommended)
    # Example: ["English", "Spanish"]
    languages = Column(JSON, nullable=True)
    gender = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all,delete-orphan")
    restaurants_created = relationship("Restaurant", back_populates="creator")
    favorites = relationship("Favorite", back_populates="user", cascade="all,delete-orphan")
    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all,delete-orphan")
    chat_sessions = relationship("AIChat", back_populates="user", cascade="all,delete-orphan")

class Owner(Base):
    __tablename__ = "owners"

    owner_id = Column(Integer, primary_key=True, index=True)
    # If you want owner login similar to users, add these:
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    restaurant_location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    claimed_restaurants = relationship("Restaurant", back_populates="claimer")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    # One-to-one with User
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    # Store list-like fields as JSON arrays
    # cuisines: ["Italian", "Mexican"]
    cuisines = Column(JSON, nullable=True)
    # price_range: "$".."$$$$"
    price_range = Column(String(10), nullable=True)
    # dietary_needs: ["vegan", "gluten-free"]
    dietary_needs = Column(JSON, nullable=True)
    # search_radius: number (miles/km - your choice)
    search_radius = Column(Integer, nullable=True)
    # ambiance_preferences: ["romantic", "casual"]
    ambiance_preferences = Column(JSON, nullable=True)
    # sort_preference: "rating" | "distance" | "popularity" | "price"
    sort_preference = Column(String(30), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="preference")

class Restaurant(Base):
    __tablename__ = "restaurants"

    restaurant_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    cuisine_type = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    address = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    # You can keep these as Text or make them JSON too
    # hours could be JSON like {"mon":"9-5","tue":"9-5"} if you want
    hours = Column(Text, nullable=True)
    contact_info = Column(Text, nullable=True)
    # These can be computed from reviews, but it's fine to store them
    avg_rating = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    # Store photo URLs as JSON array
    # Example: ["https://.../1.jpg", "https://.../2.jpg"]
    photos = Column(JSON, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    claimed_by_owner_id = Column(Integer, ForeignKey("owners.owner_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Relationships
    creator = relationship("User", back_populates="restaurants_created")
    claimer = relationship("Owner", back_populates="claimed_restaurants")
    reviews = relationship("Review", back_populates="restaurant", cascade="all,delete-orphan")
    favorites = relationship("Favorite", back_populates="restaurant", cascade="all,delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # validate 1..5 in Pydantic/service layer
    comment = Column(Text, nullable=True)
    # Server-generated timestamp
    review_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Store review photo URLs as JSON array
    photos = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "restaurant_id", name="uq_favorite_user_restaurant"))
    user = relationship("User", back_populates="favorites")
    restaurant = relationship("Restaurant", back_populates="favorites")

class AIChat(Base):
    __tablename__ = "ai_chat"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    # Store messages as JSON array of objects
    # Example:
    # [
    #   {"role":"user","content":"I want Italian"},
    #   {"role":"assistant","content":"Try Pasta Paradise..."}
    # ]
    messages_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship("User", back_populates="chat_sessions")
