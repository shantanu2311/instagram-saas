from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, billing, generate, health, posting
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    print("IGCreator API starting up...")
    yield
    print("IGCreator API shutting down...")


app = FastAPI(
    title="IGCreator API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(generate.router)
app.include_router(posting.router)
app.include_router(analytics.router)
app.include_router(billing.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "IGCreator API", "version": "0.1.0"}
