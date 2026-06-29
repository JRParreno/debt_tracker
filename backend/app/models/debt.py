import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DebtType(str, enum.Enum):
    bnpl = "bnpl"
    utility = "utility"
    loan = "loan"
    credit_card = "credit_card"
    subscription = "subscription"
    rent = "rent"
    other = "other"


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[DebtType] = mapped_column(Enum(DebtType), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    credit_limit: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    statement_balance: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    minimum_due: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    payment_card_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("payment_cards.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    occurrences: Mapped[list["DebtOccurrence"]] = relationship(
        "DebtOccurrence", back_populates="debt", cascade="all, delete-orphan"
    )


class DebtOccurrence(Base):
    __tablename__ = "debt_occurrences"
    __table_args__ = (
        UniqueConstraint("debt_id", "year", "month", name="uq_debt_year_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    debt_id: Mapped[int] = mapped_column(Integer, ForeignKey("debts.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    scheduled_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    statement_balance: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    minimum_due: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    debt: Mapped["Debt"] = relationship("Debt", back_populates="occurrences")
