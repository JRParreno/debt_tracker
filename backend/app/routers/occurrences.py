from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.card import PaymentCard
from app.models.debt import DebtOccurrence, DebtType
from app.schemas.debt import OccurrenceResponse, OccurrenceStatus, OccurrenceUpdate
from app.services.monthly_generator import MonthlyGenerator

router = APIRouter(prefix="/occurrences", tags=["occurrences"])


def get_occurrence_status(occurrence: DebtOccurrence) -> OccurrenceStatus:
    if occurrence.is_paid:
        return OccurrenceStatus.paid
    if occurrence.due_date < date.today():
        return OccurrenceStatus.overdue
    return OccurrenceStatus.pending


def to_response(occurrence: DebtOccurrence) -> OccurrenceResponse:
    credit_limit = None
    if occurrence.debt.type == DebtType.credit_card and occurrence.debt.credit_limit is not None:
        credit_limit = float(occurrence.debt.credit_limit)

    return OccurrenceResponse(
        id=occurrence.id,
        debt_id=occurrence.debt_id,
        debt_name=occurrence.debt.name,
        debt_type=occurrence.debt.type,
        year=occurrence.year,
        month=occurrence.month,
        due_date=occurrence.due_date,
        amount=float(occurrence.amount),
        scheduled_amount=float(occurrence.scheduled_amount),
        statement_balance=(
            float(occurrence.statement_balance)
            if occurrence.statement_balance is not None
            else None
        ),
        minimum_due=(
            float(occurrence.minimum_due) if occurrence.minimum_due is not None else None
        ),
        credit_limit=credit_limit,
        is_paid=occurrence.is_paid,
        paid_at=occurrence.paid_at,
        status=get_occurrence_status(occurrence),
    )


@router.get("", response_model=list[OccurrenceResponse])
def list_occurrences(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    status: OccurrenceStatus | None = None,
    type: DebtType | None = None,
    db: Session = Depends(get_db),
):
    generator = MonthlyGenerator(db)
    generator.ensure_occurrences_for_month(year, month)

    query = (
        db.query(DebtOccurrence)
        .options(joinedload(DebtOccurrence.debt))
        .join(DebtOccurrence.debt)
        .filter(
            DebtOccurrence.year == year,
            DebtOccurrence.month == month,
            DebtOccurrence.debt.has(is_active=True),
        )
    )

    if type:
        query = query.filter(DebtOccurrence.debt.has(type=type))

    occurrences = query.order_by(DebtOccurrence.due_date).all()
    results = [to_response(o) for o in occurrences]

    if status:
        results = [r for r in results if r.status == status]

    return results


@router.patch("/{occurrence_id}", response_model=OccurrenceResponse)
def update_occurrence(
    occurrence_id: int, payload: OccurrenceUpdate, db: Session = Depends(get_db)
):
    occurrence = (
        db.query(DebtOccurrence)
        .options(joinedload(DebtOccurrence.debt))
        .filter(DebtOccurrence.id == occurrence_id)
        .first()
    )
    if not occurrence:
        raise HTTPException(status_code=404, detail="Occurrence not found")

    was_paid = occurrence.is_paid
    paid_amount = float(payload.amount if payload.amount is not None else occurrence.amount)

    if payload.amount is not None:
        occurrence.amount = payload.amount
    if payload.statement_balance is not None:
        occurrence.statement_balance = payload.statement_balance
    if payload.minimum_due is not None:
        occurrence.minimum_due = payload.minimum_due

    if payload.is_paid is not None:
        occurrence.is_paid = payload.is_paid
        occurrence.paid_at = datetime.utcnow() if payload.is_paid else None

        if occurrence.debt.type == DebtType.credit_card:
            balance = occurrence.statement_balance
            if balance is not None:
                if payload.is_paid and not was_paid:
                    new_balance = max(0.0, float(balance) - paid_amount)
                    occurrence.statement_balance = new_balance
                    occurrence.debt.statement_balance = new_balance
                elif not payload.is_paid and was_paid:
                    restored = float(balance) + paid_amount
                    occurrence.statement_balance = restored
                    occurrence.debt.statement_balance = restored

    if (
        occurrence.debt.type == DebtType.credit_card
        and occurrence.debt.payment_card_id is not None
        and occurrence.statement_balance is not None
    ):
        card = (
            db.query(PaymentCard)
            .filter(PaymentCard.id == occurrence.debt.payment_card_id)
            .first()
        )
        if card:
            card.balance = float(occurrence.statement_balance)
            occurrence.debt.statement_balance = float(occurrence.statement_balance)

    db.commit()
    db.refresh(occurrence)
    return to_response(occurrence)
