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


def parse_dt(value: str) -> datetime:
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def refresh_restaurant_rating(restaurant_id: ObjectId) -> None:
    pipeline = [
        {"$match": {"restaurant_id": restaurant_id}},
        {"$group": {"_id": "$restaurant_id", "review_count": {"$sum": 1}, "avg_rating": {"$avg": "$rating"}}},
    ]
    agg = list(db["reviews"].aggregate(pipeline))
    if not agg:
        db["restaurants"].update_one({"_id": restaurant_id}, {"$set": {"review_count": 0, "avg_rating": 0.0}})
        return
    stats = agg[0]
    db["restaurants"].update_one(
        {"_id": restaurant_id},
        {"$set": {"review_count": int(stats["review_count"]), "avg_rating": float(stats["avg_rating"])}},
    )


def consume_review_created(event: dict):
    review_id = ObjectId(event["review_id"]) if event.get("review_id") else None
    doc = {
        "restaurant_id": ObjectId(event["restaurant_id"]),
        "user_id": ObjectId(event["user_id"]),
        "rating": event["rating"],
        "comment": event.get("comment"),
        "photos": event.get("photos", []),
        "review_date": parse_dt(event["review_date"]),
    }
    filter_q = {"_id": review_id} if review_id else {"restaurant_id": doc["restaurant_id"], "user_id": doc["user_id"], "review_date": doc["review_date"]}
    result = db["reviews"].update_one(filter_q, {"$setOnInsert": doc}, upsert=True)
    if result.upserted_id:
        refresh_restaurant_rating(doc["restaurant_id"])
        print(f"[review.created] inserted review={result.upserted_id}", flush=True)
    else:
        print(f"[review.created] already exists, skipped review_id={review_id}", flush=True)


def consume_review_updated(event: dict):
    review_id = ObjectId(event["review_id"])
    review = db["reviews"].find_one({"_id": review_id})
    if not review:
        print(f"[review.updated] review not found: {event['review_id']}", flush=True)
        return
    updates = event.get("updates", {})
    if not updates:
        return
    db["reviews"].update_one({"_id": review_id}, {"$set": updates})
    updated = db["reviews"].find_one({"_id": review_id})
    refresh_restaurant_rating(updated["restaurant_id"])
    print(f"[review.updated] updated review={review_id}", flush=True)


def consume_review_deleted(event: dict):
    review_id = ObjectId(event["review_id"])
    review = db["reviews"].find_one({"_id": review_id})
    if not review:
        print(f"[review.deleted] review not found: {event['review_id']}", flush=True)
        return
    restaurant_id = review["restaurant_id"]
    db["reviews"].delete_one({"_id": review_id})
    refresh_restaurant_rating(restaurant_id)
    print(f"[review.deleted] deleted review={review_id}", flush=True)


def run():
    c = Consumer({
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'review-worker-group',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
    })
    c.subscribe(['review.created', 'review.updated', 'review.deleted'])
    print("Review worker listening on review.created/review.updated/review.deleted", flush=True)
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
            if topic == 'review.created':
                consume_review_created(event)
            elif topic == 'review.updated':
                consume_review_updated(event)
            elif topic == 'review.deleted':
                consume_review_deleted(event)
    finally:
        c.close()


if __name__ == "__main__":
    run()