# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from typing import Generator

DATABASE_URL = "mysql+pymysql://root:TTGSKA1R@localhost:3306/yelp_db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
