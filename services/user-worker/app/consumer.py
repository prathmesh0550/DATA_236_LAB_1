import time
from datetime import datetime, timezone
from app.db import db
from app.config import SERVICE_NAME

def heartbeat():
    db["worker_heartbeats"].update_one(
        {"service_name": SERVICE_NAME},
        {
            "$set": {
                "service_name": SERVICE_NAME,
                "status": "running",
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

def run():
    while True:
        heartbeat()
        time.sleep(30)

if __name__ == "__main__":
    run()