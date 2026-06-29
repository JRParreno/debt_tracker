import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CardType(str, enum.Enum):
    credit_card = "credit_card"
    debit_card = "debit_card"
    online_card = "online_card"


class PaymentCard(Base):
    __tablename__ = "payment_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    card_type: Mapped[CardType] = mapped_column(Enum(CardType), nullable=False)
    credit_limit: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    minimum_due: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    due_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
