# DATA 236 Lab 2
## Yelp-Style Restaurant Discovery Platform
### Enhanced with Docker, Kubernetes, Kafka, and AWS

## Overview
This project is a Yelp-style restaurant discovery platform enhanced from Lab 1 with a full production-grade infrastructure stack. Built using:

1. React (Frontend) with Redux state management
2. FastAPI (Backend microservices)
3. MongoDB (Database)
4. Apache Kafka (Asynchronous messaging)
5. Docker & Kubernetes (Containerization & orchestration)
6. AWS EKS & ECR (Cloud deployment)

The application allows:
- Users to search restaurants, write reviews, manage favorites, and update profiles/preferences
- Owners to claim restaurants, manage listings, and view analytics
- AI chatbot to provide restaurant recommendations
- Asynchronous review and restaurant processing via Kafka

---

## Architecture

The application is split into the following microservices:

| Service | Description | Port |
|---|---|---|
| user-service | User auth, profiles, preferences | 8000 |
| owner-service | Owner auth and management | 8001 |
| restaurant-service | Restaurant CRUD, search | 8002 |
| review-service | Review CRUD | 8003 |
| user-worker | Kafka consumer for user events | - |
| restaurant-worker | Kafka consumer for restaurant events | - |
| review-worker | Kafka consumer for review events | - |

---

## Prerequisites

Make sure you have installed:
1. Python 3.9+
2. Node.js (v16+ recommended)
3. Docker Desktop
4. kubectl
5. AWS CLI (for AWS deployment only)

---

## Option 1 — Run Locally with Docker Compose

1. Make sure Docker Desktop is running

2. Build and start all services:
```bash
   docker-compose up --build
```

3. Start the frontend:
```bash
   cd frontend
   npm install
   npm start
```

Services will be available at:
- User service: http://localhost:8000/docs
- Owner service: http://localhost:8001/docs
- Restaurant service: http://localhost:8002/docs
- Review service: http://localhost:8003/docs
- Frontend: http://localhost:3000

---

## Option 2 — Run Locally with Kubernetes (Docker Desktop)

1. Enable Kubernetes in Docker Desktop settings

2. Apply all manifests in order:
```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/config-secret.yaml
   kubectl apply -f k8s/storageclass.yaml
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/kafka.yaml
   kubectl apply -f k8s/microservices.yaml
```

3. Wait for all pods to be running:
```bash
   kubectl get pods -n yelp-lab2 -w
```

4. Restore MongoDB data:
```bash
   kubectl cp dump mongodb-0:/tmp/dump -n yelp-lab2
   kubectl exec -it mongodb-0 -n yelp-lab2 -- mongorestore /tmp/dump
```

5. Port-forward services (each in a separate terminal):
```bash
   kubectl port-forward svc/user-service 8000:8000 -n yelp-lab2
   kubectl port-forward svc/owner-service 8001:8000 -n yelp-lab2
   kubectl port-forward svc/restaurant-service 8002:8000 -n yelp-lab2
   kubectl port-forward svc/review-service 8003:8000 -n yelp-lab2
```

6. Start the frontend:
```bash
   cd frontend
   npm install
   npm start
```

---

## Option 3 — Deploy to AWS EKS

1. Configure AWS credentials:
```bash
   aws configure
```

2. Login to ECR and push images:
```bash
   aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 358304212325.dkr.ecr.us-west-1.amazonaws.com

   docker build -t 358304212325.dkr.ecr.us-west-1.amazonaws.com/services/user-service:latest ./services/user-service
   docker push 358304212325.dkr.ecr.us-west-1.amazonaws.com/services/user-service:latest
   # Repeat for all services
```

3. Create EKS cluster (via AWS Console or CLI)

4. Connect kubectl to EKS:
```bash
   aws eks update-kubeconfig --region us-west-1 --name yelp-lab2
```

5. Apply manifests:
```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/config-secret.yaml
   kubectl apply -f k8s/storageclass.yaml
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/kafka.yaml
   kubectl apply -f k8s/microservices.yaml
```

6. Restore MongoDB data:
```bash
   kubectl cp dump mongodb-0:/tmp/dump -n yelp-lab2
   kubectl exec -it mongodb-0 -n yelp-lab2 -- mongorestore /tmp/dump
```

---

## Kafka Flow

Reviews and restaurants are processed asynchronously through Kafka:

| Topic | Producer | Consumer |
|---|---|---|
| review.created | review-service | review-worker |
| review.updated | review-service | review-worker |
| review.deleted | review-service | review-worker |
| restaurant.created | restaurant-service | restaurant-worker |

When a user submits a review, the review-service publishes an event to Kafka. The review-worker consumes the event and writes it to MongoDB. This decouples the API response from the database write.

---

## Redux State Management

Redux is integrated into the React frontend to manage:
- **Auth slice** — JWT token, user session, and role
- **Restaurant slice** — restaurant list, search results, and details
- **Review slice** — review status and updates
- **Favourites slice** — user's favorited restaurants

---

## Features

### User Features
1. Signup / Login
2. Search restaurants (keyword, city, zip, cuisine)
3. View restaurant details and reviews
4. Add/remove favorites
5. Write, edit, delete reviews (processed via Kafka)
6. View history (reviews + restaurants added)
7. Profile management
8. Preferences management

### Owner Features
1. Owner signup / login
2. Add restaurant (processed via Kafka)
3. Edit restaurant
4. Upload photos
5. View dashboard analytics
6. Filter reviews

### AI Chatbot
1. Ask for restaurant recommendations
2. Uses keyword + user preferences
3. Returns top ranked restaurants

---

## Notes
1. All services must be running before using the frontend
2. MongoDB data must be restored after a fresh cluster deployment
3. Kafka topics are auto-created on first message
4. Do not commit venv, node_modules, or __pycache__
5. Keep AWS credentials secure and never commit them
