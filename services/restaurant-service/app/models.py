from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from bson import ObjectId


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(value: str | ObjectId | None) -> Optional[ObjectId]:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return value
    return ObjectId(value)


def serialize_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if not doc:
        return None

    out = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, list):
            out[key] = [str(v) if isinstance(v, ObjectId) else v for v in value]
        else:
            out[key] = value
    return out


def build_restaurant_doc(data: dict, created_by_user_id: str | ObjectId | None = None) -> dict:
    return {
        "name": data.get("name"),
        "cuisine_type": data.get("cuisine_type"),
        "city": data.get("city"),
        "zip_code": data.get("zip_code"),
        "address": data.get("address"),
        "description": data.get("description"),
        "hours": data.get("hours"),
        "contact_info": data.get("contact_info"),
        "price_tier": data.get("price_tier"),
        "avg_rating": 0.0,
        "review_count": 0,
        "photos": data.get("photos") or [],
        "created_by_user_id": to_object_id(created_by_user_id) if created_by_user_id else None,
        "claimed_by_owner_id": None,
        "created_at": utcnow(),
    }