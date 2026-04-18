from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from pymongo.database import Database

from app.db import get_db
from app.security import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(
    db: Database = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials

    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "user":
        raise HTTPException(status_code=403, detail="User token required")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user = db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id")

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def get_current_owner(
    db: Database = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials

    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner token required")

    owner_id = payload.get("sub")
    if not owner_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        owner = db["owners"].find_one({"_id": ObjectId(owner_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid owner id")

    if not owner:
        raise HTTPException(status_code=401, detail="Owner not found")

    return owner