"""
Main Application Entry Point
Registers all route modules and initializes the database.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import init_db
from app.api.routes import auth, onboarding, users, advertisements, documents, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title="Marketing Analytics Platform",
    description="AI-powered marketing automation with human-in-the-loop governance",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Route Modules ──────────────────────────────────────────────────
# Each module is independently developed and tested

app.include_router(auth.router,           prefix="/api")
app.include_router(onboarding.router,     prefix="/api")
app.include_router(users.router,          prefix="/api")
app.include_router(documents.router,      prefix="/api")
app.include_router(advertisements.router, prefix="/api")
app.include_router(analytics.router,      prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
