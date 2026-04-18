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