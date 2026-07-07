from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis

from app.api.auth import router as auth_router
from app.api.content_generator import router as content_generator_router
from app.api.dashboard import router as dashboard_router
from app.api.product_hunter import router as product_hunter_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import check_database_connection, engine
from app.models.content_generation import ContentGeneration
from app.models.product_analysis import ProductAnalysis
from app.models.user import User


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AffiliateAI Pro - AI-powered affiliate marketing SaaS platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "name": "AffiliateAI Pro",
        "status": "running",
        "message": "Backend API online.",
    }


@app.get("/health")
def health_check():
    database_ok = check_database_connection()

    redis_ok = False

    try:
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
        redis_ok = bool(redis_client.ping())
    except Exception:
        redis_ok = False

    return {
        "status": "ok" if database_ok and redis_ok else "degraded",
        "services": {
            "api": True,
            "database": database_ok,
            "redis": redis_ok,
        },
    }


app.include_router(auth_router)
app.include_router(product_hunter_router)
app.include_router(content_generator_router)
app.include_router(dashboard_router)