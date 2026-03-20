from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Owner
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "user":
        raise HTTPException(status_code=403, detail="User token required")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_owner(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Owner:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner token required")

    owner_id = payload.get("sub")
    if owner_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    owner = db.query(Owner).filter(Owner.owner_id == int(owner_id)).first()
    if not owner:
        raise HTTPException(status_code=401, detail="Owner not found")
    return owner