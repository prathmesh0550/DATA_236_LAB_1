from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database

from app.db import get_db
from app.schemas import OwnerSignupIn, OwnerLoginIn, OwnerOut, TokenOut
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_owner
from app.models import build_owner_doc

router = APIRouter(prefix="/auth", tags=["auth"])


def serialize_owner(doc: dict) -> dict:
    return {
        "owner_id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
        "restaurant_location": doc.get("restaurant_location"),
    }


@router.post("/signup", response_model=OwnerOut, status_code=status.HTTP_201_CREATED)
def owner_signup(body: OwnerSignupIn, db: Database = Depends(get_db)):
    if db["owners"].find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    owner_doc = build_owner_doc(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        restaurant_location=body.restaurant_location,
    )
    result = db["owners"].insert_one(owner_doc)

    created_owner = db["owners"].find_one({"_id": result.inserted_id})
    return serialize_owner(created_owner)


@router.post("/login", response_model=TokenOut)
def owner_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db),
):
    owner = db["owners"].find_one({"email": form_data.username})

    if not owner or not verify_password(form_data.password, owner["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(owner["_id"]), role="owner")
    return TokenOut(access_token=token, token_type="bearer")


@router.post("/logout")
def owner_logout():
    return {"ok": True, "message": "Delete token on client. Server-side logout requires session/token blacklist."}


@router.get("/me", response_model=OwnerOut)
def owner_me(current_owner: dict = Depends(get_current_owner)):
    return serialize_owner(current_owner)