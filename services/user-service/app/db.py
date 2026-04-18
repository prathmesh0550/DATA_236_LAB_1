from pymongo import MongoClient
from app.config import MONGO_URI, MONGO_DB_NAME

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]


def get_db():
    return db


def init_indexes():
    db["users"].create_index("email", unique=True)
    db["user_preferences"].create_index("user_id", unique=True)
    db["favorites"].create_index([("user_id", 1), ("restaurant_id", 1)], unique=True)
    db["ai_chat"].create_index("user_id")

    # Sessions (for lab requirement)
    db["sessions"].create_index("expires_at", expireAfterSeconds=0)