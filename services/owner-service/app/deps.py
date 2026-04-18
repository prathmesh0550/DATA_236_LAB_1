from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from pymongo.database import Database

from app.db import get_db
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_owner(
    db: Database = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner token required")

    owner_id = payload.get("sub")
    if not owner_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    owner = db["owners"].find_one({"_id": ObjectId(owner_id)})
    if not owner:
        raise HTTPException(status_code=401, detail="Owner not found")

    return owner