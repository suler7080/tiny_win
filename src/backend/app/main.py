"""Tiny Win — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .redis import close_redis, init_redis
from .routers import auth, feed, reactions, streaks, wins


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect Redis. Shutdown: disconnect Redis."""
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


@app.get("/health")
async def health():
    return {"status": "ok"}
