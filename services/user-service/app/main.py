from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db import init_indexes
from app.routers import auth, users, favorites, ai_chatbot

load_dotenv()

app = FastAPI(title="User Service")

@app.on_event("startup")
def startup_event():
    init_indexes()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "User Service is running"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(favorites.router)
app.include_router(ai_chatbot.router)