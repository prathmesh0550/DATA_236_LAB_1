from pymongo import MongoClient
from app.config import MONGO_URI, MONGO_DB_NAME

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]


def get_db():
    return db


def init_indexes():
    db["reviews"].create_index("restaurant_id")
    db["reviews"].create_index("user_id")
    db["reviews"].create_index([("restaurant_id", 1), ("user_id", 1)])