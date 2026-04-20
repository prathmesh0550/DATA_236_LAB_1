import json
from datetime import datetime, timezone
from bson import ObjectId
from confluent_kafka import Consumer, KafkaException, KafkaError
from app.db import db
from app.config import KAFKA_BOOTSTRAP_SERVERS, SERVICE_NAME


def heartbeat():
    db["worker_heartbeats"].update_one(
        {"service_name": SERVICE_NAME},
        {"$set": {"service_name": SERVICE_NAME, "status": "running", "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


def consume_user_updated(event: dict):
    user_id = ObjectId(event["user_id"])
    updates = event["updates"]
    db["users"].update_one({"_id": user_id}, {"$set": updates})
    print(f"[user.updated] updated user={user_id}", flush=True)


def consume_user_preferences_updated(event: dict):
    user_id = ObjectId(event["user_id"])
    data = event["preferences"]
    data["updated_at"] = datetime.fromisoformat(event["updated_at"])
    db["user_preferences"].update_one(
        {"user_id": user_id},
        {"$set": data, "$setOnInsert": {"user_id": user_id}},
        upsert=True,
    )
    print(f"[user.preferences.updated] updated preferences for user={user_id}", flush=True)


def consume_favorite_added(event: dict):
    user_id = ObjectId(event["user_id"])
    restaurant_id = ObjectId(event["restaurant_id"])
    exists = db["favorites"].find_one({"user_id": user_id, "restaurant_id": restaurant_id})
    if not exists:
        db["favorites"].insert_one({"user_id": user_id, "restaurant_id": restaurant_id})
    print(f"[favorite.added] user={user_id} restaurant={restaurant_id}", flush=True)


def consume_favorite_removed(event: dict):
    user_id = ObjectId(event["user_id"])
    restaurant_id = ObjectId(event["restaurant_id"])
    db["favorites"].delete_one({"user_id": user_id, "restaurant_id": restaurant_id})
    print(f"[favorite.removed] user={user_id} restaurant={restaurant_id}", flush=True)


def run():
    c = Consumer({
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'user-worker-group',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
    })
    c.subscribe(['user.updated', 'user.preferences.updated', 'favorite.added', 'favorite.removed'])
    print("User worker listening...", flush=True)
    try:
        while True:
            msg = c.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError.UNKNOWN_TOPIC_OR_PART:
                    continue
                raise KafkaException(msg.error())
            topic = msg.topic()
            event = json.loads(msg.value().decode('utf-8'))
            print(f"Received {topic}: {event}", flush=True)
            heartbeat()
            if topic == 'user.updated':
                consume_user_updated(event)
            elif topic == 'user.preferences.updated':
                consume_user_preferences_updated(event)
            elif topic == 'favorite.added':
                consume_favorite_added(event)
            elif topic == 'favorite.removed':
                consume_favorite_removed(event)
    finally:
        c.close()


if __name__ == "__main__":
    run()