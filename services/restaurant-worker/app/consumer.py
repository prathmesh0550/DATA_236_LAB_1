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


def consume_restaurant_created(event: dict):
    restaurant_id = ObjectId(event["restaurant_id"]) if event.get("restaurant_id") else None
    doc = {
        "name": event["name"],
        "cuisine_type": event["cuisine_type"],
        "city": event["city"],
        "zip_code": event["zip_code"],
        "address": event["address"],
        "description": event["description"],
        "hours": event["hours"],
        "contact_info": event["contact_info"],
        "price_tier": event["price_tier"],
        "created_by_user_id": ObjectId(event["created_by_user_id"]),
        "claimed_by_owner_id": ObjectId(event["claimed_by_owner_id"]) if event.get("claimed_by_owner_id") else None,
        "photos": event.get("photos", []),
        "avg_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.fromisoformat(event["created_at"]),
    }
    filter_q = {"_id": restaurant_id} if restaurant_id else {"name": doc["name"], "created_at": doc["created_at"]}
    result = db["restaurants"].update_one(filter_q, {"$setOnInsert": doc}, upsert=True)
    if result.upserted_id:
        print(f"[restaurant.created] inserted restaurant={result.upserted_id}", flush=True)
    else:
        print(f"[restaurant.created] already exists, skipped restaurant_id={restaurant_id}", flush=True)


def consume_restaurant_updated(event: dict):
    restaurant_id = ObjectId(event["restaurant_id"])
    updates = event["updates"]
    db["restaurants"].update_one({"_id": restaurant_id}, {"$set": updates})
    print(f"[restaurant.updated] updated restaurant={restaurant_id}", flush=True)


def consume_restaurant_claimed(event: dict):
    restaurant_id = ObjectId(event["restaurant_id"])
    owner_id = ObjectId(event["claimed_by_owner_id"])
    db["restaurants"].update_one(
        {"_id": restaurant_id},
        {"$set": {"claimed_by_owner_id": owner_id}},
    )
    print(f"[restaurant.claimed] restaurant={restaurant_id} owner={owner_id}", flush=True)


def run():
    c = Consumer({
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'restaurant-worker-group',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
    })
    c.subscribe(['restaurant.created', 'restaurant.updated', 'restaurant.claimed'])
    print("Restaurant worker listening...", flush=True)
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
            if topic == 'restaurant.created':
                consume_restaurant_created(event)
            elif topic == 'restaurant.updated':
                consume_restaurant_updated(event)
            elif topic == 'restaurant.claimed':
                consume_restaurant_claimed(event)
    finally:
        c.close()


if __name__ == "__main__":
    run()