import os
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_dev_key_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def hash_password(password: str):
    return pwd_ctx.hash(password)


def verify_password(password: str, hashed: str):
    return pwd_ctx.verify(password, hashed)


def create_access_token(user_id: int, role: str):
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(tz=None) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")