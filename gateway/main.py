import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to sys.path to allow importing from 'backend' sibling
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.core.config import settings
from api import analysis_router

app = FastAPI(title=settings.PROJECT_NAME)

# Relaxed CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
async def root():
    return {"message": "Welcome to Report Analysis API"}

# Include routers
app.include_router(analysis_router.router, prefix="/api/analysis", tags=["analysis"])
