import json
from confluent_kafka import Producer
from app.config import KAFKA_BOOTSTRAP_SERVERS

_producer = None


def get_producer() -> Producer:
    global _producer
    if _producer is not None:
        return _producer
    _producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS})
    return _producer


def kafka_send(topic: str, value: dict):
    producer = get_producer()
    producer.produce(topic, json.dumps(value).encode('utf-8'))
    producer.flush()