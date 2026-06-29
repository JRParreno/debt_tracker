from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PayFrequency(str, Enum):
    monthly = "monthly"
    semi_monthly = "semi_monthly"


class IncomeUpdate(BaseModel):
    pay_frequency: PayFrequency
    monthly_amount: float | None = Field(default=None, ge=0)
    pay_day: int | None = Field(default=None, ge=1, le=28)
    cutoff_1_day: int | None = Field(default=None, ge=1, le=28)
    cutoff_1_amount: float | None = Field(default=None, ge=0)
    cutoff_2_day: int | None = Field(default=None, ge=1, le=28)
    cutoff_2_amount: float | None = Field(default=None, ge=0)


class IncomeResponse(BaseModel):
    id: int
    pay_frequency: PayFrequency
    monthly_amount: float | None
    pay_day: int | None
    cutoff_1_day: int | None
    cutoff_1_amount: float | None
    cutoff_2_day: int | None
    cutoff_2_amount: float | None
    updated_at: datetime

    model_config = {"from_attributes": True}
