from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.card import CardType, PaymentCard
from app.models.debt import Debt, DebtOccurrence, DebtType
from app.schemas.debt import DebtCreate, DebtResponse, DebtUpdate
from app.services.monthly_generator import (
    MonthlyGenerator,
    compute_end_date_from_installments,
)

router = APIRouter(prefix="/debts", tags=["debts"])


def _get_credit_card(db: Session, payment_card_id: int) -> PaymentCard:
    card = (
        db.query(PaymentCard)
        .filter(
            PaymentCard.id == payment_card_id,
            PaymentCard.is_active.is_(True),
            PaymentCard.card_type == CardType.credit_card,
        )
        .first()
    )
    if not card:
        raise HTTPException(status_code=400, detail="Credit card not found in My Cards")
    return card


@router.get("", response_model=list[DebtResponse])
def list_debts(db: Session = Depends(get_db)):
    return db.query(Debt).filter(Debt.is_active.is_(True)).order_by(Debt.name).all()


@router.get("/{debt_id}", response_model=DebtResponse)
def get_debt(debt_id: int, db: Session = Depends(get_db)):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.is_active.is_(True)).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return debt


@router.post("", response_model=DebtResponse, status_code=201)
def create_debt(payload: DebtCreate, db: Session = Depends(get_db)):
    start_date = payload.start_date or date.today()
    end_date = payload.end_date

    if payload.total_installments:
        end_date = compute_end_date_from_installments(
            start_date, payload.total_installments, payload.due_day
        )

    name = payload.name
    due_day = payload.due_day
    amount = payload.amount
    credit_limit = payload.credit_limit
    statement_balance = payload.statement_balance
    minimum_due = payload.minimum_due
    payment_card_id = payload.payment_card_id

    if payload.type == DebtType.credit_card:
        if payment_card_id is None:
            raise HTTPException(
                status_code=400, detail="Select a credit card from My Cards"
            )
        card = _get_credit_card(db, payment_card_id)
        existing = (
            db.query(Debt)
            .filter(
                Debt.payment_card_id == payment_card_id,
                Debt.is_active.is_(True),
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"{card.nickname} is already added as a monthly bill",
            )
        name = card.nickname
        credit_limit = float(card.credit_limit) if card.credit_limit is not None else None
        statement_balance = float(card.balance)
        minimum_due = (
            float(payload.minimum_due)
            if payload.minimum_due is not None
            else (float(card.minimum_due) if card.minimum_due is not None else None)
        )
        if minimum_due is None or minimum_due <= 0:
            raise HTTPException(
                status_code=400,
                detail="Minimum amount due is required (set on the card or in the form)",
            )
        amount = minimum_due
        due_day = card.due_day if card.due_day is not None else payload.due_day

    debt = Debt(
        name=name,
        type=payload.type,
        amount=amount,
        due_day=due_day,
        notes=payload.notes,
        start_date=start_date,
        end_date=end_date,
        credit_limit=credit_limit,
        statement_balance=statement_balance,
        minimum_due=minimum_due,
        payment_card_id=payment_card_id,
    )
    db.add(debt)
    db.commit()
    db.refresh(debt)

    generator = MonthlyGenerator(db)
    installments_paid = payload.installments_paid or 0
    if payload.total_installments:
        generator.ensure_debt_full_schedule(debt, installments_paid=installments_paid)
    else:
        generator.ensure_buffer_from_today(months_ahead=2)

    if (
        payload.type == DebtType.credit_card
        and payload.paid_this_month is not None
        and payload.paid_this_month > 0
    ):
        paid_amount = float(payload.paid_this_month)
        if statement_balance is not None and paid_amount > float(statement_balance):
            raise HTTPException(
                status_code=400,
                detail="Payment cannot exceed the card statement balance",
            )

        occurrence = (
            db.query(DebtOccurrence)
            .filter(
                DebtOccurrence.debt_id == debt.id,
                DebtOccurrence.year == start_date.year,
                DebtOccurrence.month == start_date.month,
            )
            .first()
        )
        if occurrence:
            occurrence.scheduled_amount = float(minimum_due)
            occurrence.amount = paid_amount
            occurrence.is_paid = True
            occurrence.paid_at = datetime.utcnow()
            if statement_balance is not None:
                new_balance = max(0.0, float(statement_balance) - paid_amount)
                occurrence.statement_balance = new_balance
                debt.statement_balance = new_balance
                if payment_card_id:
                    card = db.query(PaymentCard).filter(PaymentCard.id == payment_card_id).first()
                    if card:
                        card.balance = new_balance
            db.commit()
            db.refresh(debt)

    return debt


@router.patch("/{debt_id}", response_model=DebtResponse)
def update_debt(debt_id: int, payload: DebtUpdate, db: Session = Depends(get_db)):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.is_active.is_(True)).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    updates = payload.model_dump(exclude_unset=True)
    total_installments = updates.pop("total_installments", None)

    for field, value in updates.items():
        setattr(debt, field, value)

    if total_installments is not None:
        debt.end_date = compute_end_date_from_installments(
            debt.start_date, total_installments, debt.due_day
        )
    elif "end_date" in updates and updates["end_date"] is None:
        debt.end_date = None

    db.commit()
    db.refresh(debt)

    MonthlyGenerator(db).resync_debt_schedule(debt)

    return debt


@router.delete("/{debt_id}", response_model=DebtResponse)
def delete_debt(debt_id: int, db: Session = Depends(get_db)):
    debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")

    debt.is_active = False
    db.commit()
    db.refresh(debt)
    return debt
