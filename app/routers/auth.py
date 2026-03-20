from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Owner, UserPreference
from app.schemas import UserSignupIn, UserOut, OwnerSignupIn, OwnerOut, TokenOut
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user, get_current_owner

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------- USER SIGNUP ----------
@router.post("/user/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def user_signup(body: UserSignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    pref = UserPreference(user_id=user.user_id)
    db.add(pref)
    db.commit()

    return user


# ---------- OWNER SIGNUP ----------
@router.post("/owner/signup", response_model=OwnerOut, status_code=status.HTTP_201_CREATED)
def owner_signup(body: OwnerSignupIn, db: Session = Depends(get_db)):
    if db.query(Owner).filter(Owner.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

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


# ---------- SHARED LOGIN FOR SWAGGER ----------
@router.post("/login", response_model=TokenOut)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Try user first
    user = db.query(User).filter(User.email == form_data.username).first()
    if user and verify_password(form_data.password, user.password_hash):
        token = create_access_token(user.user_id, role="user")
        return TokenOut(access_token=token, token_type="bearer")

    # Then try owner
    owner = db.query(Owner).filter(Owner.email == form_data.username).first()
    if owner and verify_password(form_data.password, owner.password_hash):
        token = create_access_token(owner.owner_id, role="owner")
        return TokenOut(access_token=token, token_type="bearer")

    raise HTTPException(status_code=401, detail="Invalid email or password")


# ---------- OPTIONAL: KEEP SEPARATE LOGINS TOO ----------
@router.post("/user/login", response_model=TokenOut)
def user_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.user_id, role="user")
    return TokenOut(access_token=token, token_type="bearer")


@router.post("/owner/login", response_model=TokenOut)
def owner_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    owner = db.query(Owner).filter(Owner.email == form_data.username).first()

    if not owner or not verify_password(form_data.password, owner.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(owner.owner_id, role="owner")
    return TokenOut(access_token=token, token_type="bearer")


# ---------- LOGOUT ----------
@router.post("/user/logout")
def user_logout():
    return {"ok": True, "message": "Delete token on client. Server-side logout requires a blacklist."}


# ---------- CURRENT AUTHED USER / OWNER ----------
@router.get("/user/me", response_model=UserOut)
def user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/owner/me", response_model=OwnerOut)
def owner_me(current_owner: Owner = Depends(get_current_owner)):
    return current_owner