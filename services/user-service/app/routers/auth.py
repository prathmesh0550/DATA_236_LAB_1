from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database

from app.db import get_db
from app.schemas import UserSignupIn, UserLoginIn, UserOut, TokenOut
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.models import build_user_doc, build_user_preference_doc

router = APIRouter(prefix="/auth", tags=["auth"])


def serialize_user(doc: dict) -> dict:
    return {
        "user_id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
    }


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def user_signup(body: UserSignupIn, db: Database = Depends(get_db)):
    if db["users"].find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = build_user_doc(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    result = db["users"].insert_one(user_doc)

    pref_doc = build_user_preference_doc(result.inserted_id)
    db["user_preferences"].insert_one(pref_doc)

    created_user = db["users"].find_one({"_id": result.inserted_id})
    return serialize_user(created_user)


@router.post("/login", response_model=TokenOut)
def user_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db),
):
    user = db["users"].find_one({"email": form_data.username})

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user["_id"]), role="user")

    now = datetime.now(timezone.utc)
    db["sessions"].insert_one({
        "user_id": user["_id"],
        "token": token,
        "role": "user",
        "created_at": now,
        "expires_at": now + timedelta(minutes=60),
    })

    return TokenOut(access_token=token, token_type="bearer")


@router.post("/logout")
def user_logout():
    return {"ok": True, "message": "Delete token on client. Server-side logout requires session/token blacklist."}


@router.get("/me", response_model=UserOut)
def user_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)