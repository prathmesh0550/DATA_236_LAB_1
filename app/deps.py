from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Owner
from app.security import decode_token

# Separate schemes so Swagger "Authorize" works for both token URLs
user_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/user/login")
owner_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/owner/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(user_oauth2)) -> User:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "user":
        raise HTTPException(status_code=403, detail="User token required")

    user_id = int(payload["sub"])
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_current_owner(db: Session = Depends(get_db), token: str = Depends(owner_oauth2)) -> Owner:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner token required")

    owner_id = int(payload["sub"])
    owner = db.query(Owner).filter(Owner.owner_id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=401, detail="Owner not found")
    return owner
