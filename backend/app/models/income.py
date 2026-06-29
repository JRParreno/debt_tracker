import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PayFrequency(str, enum.Enum):
    monthly = "monthly"
    semi_monthly = "semi_monthly"


class IncomeSettings(Base):
    __tablename__ = "income_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pay_frequency: Mapped[PayFrequency] = mapped_column(
        Enum(PayFrequency), nullable=False, default=PayFrequency.monthly
    )
    monthly_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    pay_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cutoff_1_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cutoff_1_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    cutoff_2_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cutoff_2_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
