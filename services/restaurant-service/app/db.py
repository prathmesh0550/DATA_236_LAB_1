from pymongo import MongoClient
from app.config import MONGO_URI, MONGO_DB_NAME

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]


def get_db():
    return db


def init_indexes():
    db["restaurants"].create_index("name")
    db["restaurants"].create_index("city")
    db["restaurants"].create_index("zip_code")
    db["restaurants"].create_index("cuisine_type")
    db["restaurants"].create_index("created_by_user_id")
    db["restaurants"].create_index("claimed_by_owner_id")