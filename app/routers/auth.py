from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Owner, UserPreference
from app.schemas import (UserSignupIn, UserLoginIn, UserOut, OwnerSignupIn, OwnerLoginIn, OwnerOut, TokenOut)
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user, get_current_owner

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------- USER AUTH ----------
@router.post("/user/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def user_signup(body: UserSignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create blank preferences row
    pref = UserPreference(user_id=user.user_id)
    db.add(pref)
    db.commit()

    return user

@router.post("/user/login", response_model=TokenOut)
def user_login(body: UserLoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, detail="Invalid email or password")

    token = create_access_token(user.user_id, role="user")
    return TokenOut(access_token=token)

@router.post("/user/logout")
def user_logout():
    # JWT logout is client-side unless you implement a blacklist
    return {"ok": True, "message": "Delete token on client. Server-side logout requires a blacklist."}

@router.get("/user/me", response_model=UserOut)
def user_me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------- OWNER AUTH ----------
@router.post("/owner/signup", response_model=OwnerOut, status_code=status.HTTP_201_CREATED)
def owner_signup(body: OwnerSignupIn, db: Session = Depends(get_db)):
    if db.query(Owner).filter(Owner.email == body.email).first():
        raise HTTPException(400, detail="Email already registered")

    owner = Owner(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        restaurant_location=body.restaurant_location,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner

@router.post("/owner/login", response_model=TokenOut)
def owner_login(body: OwnerLoginIn, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.email == body.email).first()
    if not owner or not verify_password(body.password, owner.password_hash):
        raise HTTPException(401, detail="Invalid email or password")

    token = create_access_token(owner.owner_id, role="owner")
    return TokenOut(access_token=token)

@router.get("/owner/me", response_model=OwnerOut)
def owner_me(current_owner: Owner = Depends(get_current_owner)):
    return current_owner
