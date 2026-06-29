from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import cards, debts, income, occurrences, summary


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Debt Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router)
app.include_router(debts.router)
app.include_router(occurrences.router)
app.include_router(income.router)
app.include_router(summary.router)


@app.get("/health")
def health():
    return {"status": "ok"}
