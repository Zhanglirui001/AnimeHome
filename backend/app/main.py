from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import characters, chat, images, messages
from .database import engine, Base
import os

# Create tables if they don't exist (though we will use init_db.py usually)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="AnimeHome API")

# Mount static directory for avatars
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(characters.router)
app.include_router(chat.router)
app.include_router(images.router)
app.include_router(images.upload_router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AnimeHome API"}
