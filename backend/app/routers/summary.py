from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.debt import DebtOccurrence
from app.schemas.debt import OccurrenceStatus
from app.schemas.summary import CurrentSummary, MonthlySummaryItem, StrategySummary
from app.services.monthly_generator import MonthlyGenerator
from app.services.strategy_service import StrategyService, get_or_create_income

router = APIRouter(prefix="/summary", tags=["summary"])


def _occurrence_status(occurrence: DebtOccurrence) -> OccurrenceStatus:
    if occurrence.is_paid:
        return OccurrenceStatus.paid
    if occurrence.due_date < date.today():
        return OccurrenceStatus.overdue
    return OccurrenceStatus.pending


@router.get("/monthly", response_model=list[MonthlySummaryItem])
def monthly_summary(
    months: int = Query(default=12, ge=1, le=24),
    db: Session = Depends(get_db),
):
    today = date.today()
    generator = MonthlyGenerator(db)
    items: list[MonthlySummaryItem] = []

    for i in range(months - 1, -1, -1):
        target = today - relativedelta(months=i)
        year, month = target.year, target.month
        generator.ensure_occurrences_for_month(year, month)

        rows = (
            db.query(DebtOccurrence)
            .join(DebtOccurrence.debt)
            .filter(
                DebtOccurrence.year == year,
                DebtOccurrence.month == month,
                DebtOccurrence.debt.has(is_active=True),
            )
            .all()
        )

        total = sum(float(r.amount) for r in rows)
        paid = sum(float(r.amount) for r in rows if r.is_paid)
        items.append(
            MonthlySummaryItem(
                year=year,
                month=month,
                total=total,
                paid=paid,
                unpaid=total - paid,
            )
        )

    return items


@router.get("/current", response_model=CurrentSummary)
def current_summary(
    year: int | None = Query(default=None),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    today = date.today()
    year = year if year is not None else today.year
    month = month if month is not None else today.month

    generator = MonthlyGenerator(db)
    generator.ensure_occurrences_for_month(year, month)

    rows = (
        db.query(DebtOccurrence)
        .join(DebtOccurrence.debt)
        .filter(
            DebtOccurrence.year == year,
            DebtOccurrence.month == month,
            DebtOccurrence.debt.has(is_active=True),
        )
        .all()
    )

    total = sum(float(r.amount) for r in rows)
    paid = sum(float(r.amount) for r in rows if r.is_paid)
    pending_count = sum(
        1 for r in rows if _occurrence_status(r) == OccurrenceStatus.pending
    )
    overdue_count = sum(
        1 for r in rows if _occurrence_status(r) == OccurrenceStatus.overdue
    )

    income = get_or_create_income(db)
    if income.pay_frequency.value == "monthly":
        total_income = float(income.monthly_amount or 0)
    else:
        total_income = float(income.cutoff_1_amount or 0) + float(
            income.cutoff_2_amount or 0
        )

    return CurrentSummary(
        year=year,
        month=month,
        total=total,
        paid=paid,
        unpaid=total - paid,
        pending_count=pending_count,
        overdue_count=overdue_count,
        total_income=total_income,
        surplus=total_income - (total - paid),
    )


@router.get("/strategy", response_model=StrategySummary)
def strategy_summary(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    generator = MonthlyGenerator(db)
    generator.ensure_occurrences_for_month(year, month)
    return StrategyService(db).get_strategy(year, month)
