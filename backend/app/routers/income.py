from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.income import IncomeSettings
from app.schemas.income import IncomeResponse, IncomeUpdate
from app.services.strategy_service import get_or_create_income

router = APIRouter(prefix="/income", tags=["income"])


@router.get("", response_model=IncomeResponse)
def get_income(db: Session = Depends(get_db)):
    income = get_or_create_income(db)
    return income


@router.patch("", response_model=IncomeResponse)
def update_income(payload: IncomeUpdate, db: Session = Depends(get_db)):
    income = get_or_create_income(db)

    for field, value in payload.model_dump().items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income
