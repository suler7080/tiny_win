"""Tiny Win — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from . import models  # Register all models for metadata creation
from .redis import close_redis, init_redis
from .routers import auth, feed, friends, reactions, streaks, wins


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: auto-create database tables and connect Redis. Shutdown: disconnect Redis."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Warning: Auto-migration error: {e}")
    
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="RESTful API for Tiny Win — the minimalist daily-win social platform.",
    lifespan=lifespan,
    root_path="/v1",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(wins.router)
app.include_router(feed.router)
app.include_router(reactions.router)
app.include_router(streaks.router)
app.include_router(friends.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
