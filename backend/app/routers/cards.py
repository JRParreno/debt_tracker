from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.card import CardType, PaymentCard
from app.models.debt import Debt
from app.schemas.card import CardCreate, CardResponse, CardUpdate

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("", response_model=list[CardResponse])
def list_cards(db: Session = Depends(get_db)):
    return (
        db.query(PaymentCard)
        .filter(PaymentCard.is_active.is_(True))
        .order_by(PaymentCard.nickname)
        .all()
    )


@router.get("/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = (
        db.query(PaymentCard)
        .filter(PaymentCard.id == card_id, PaymentCard.is_active.is_(True))
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("", response_model=CardResponse, status_code=201)
def create_card(payload: CardCreate, db: Session = Depends(get_db)):
    if (
        payload.card_type == CardType.credit_card
        and payload.credit_limit is not None
        and payload.balance > payload.credit_limit
    ):
        raise HTTPException(status_code=400, detail="Balance cannot exceed credit limit")

    card = PaymentCard(
        nickname=payload.nickname.strip(),
        card_type=payload.card_type,
        credit_limit=payload.credit_limit,
        balance=payload.balance,
        minimum_due=payload.minimum_due,
        due_day=payload.due_day,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/{card_id}", response_model=CardResponse)
def update_card(card_id: int, payload: CardUpdate, db: Session = Depends(get_db)):
    card = (
        db.query(PaymentCard)
        .filter(PaymentCard.id == card_id, PaymentCard.is_active.is_(True))
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    updates = payload.model_dump(exclude_unset=True)
    new_type = updates.get("card_type", card.card_type)

    for field, value in updates.items():
        setattr(card, field, value)

    if new_type != CardType.credit_card:
        card.credit_limit = None
        card.minimum_due = None
        card.due_day = None

    limit = float(card.credit_limit) if card.credit_limit is not None else None
    balance = float(card.balance)
    if card.card_type == CardType.credit_card and limit is not None and balance > limit:
        raise HTTPException(status_code=400, detail="Balance cannot exceed credit limit")

    if card.card_type == CardType.credit_card:
        linked_debts = (
            db.query(Debt)
            .filter(Debt.payment_card_id == card.id, Debt.is_active.is_(True))
            .all()
        )
        for debt in linked_debts:
            debt.name = card.nickname
            debt.statement_balance = balance
            debt.credit_limit = limit
            if card.minimum_due is not None:
                debt.minimum_due = float(card.minimum_due)
                debt.amount = float(card.minimum_due)
            if card.due_day is not None:
                debt.due_day = card.due_day

    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", response_model=CardResponse)
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = (
        db.query(PaymentCard)
        .filter(PaymentCard.id == card_id, PaymentCard.is_active.is_(True))
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.is_active = False
    db.commit()
    db.refresh(card)
    return card
