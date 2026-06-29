from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class DebtType(str, Enum):
    bnpl = "bnpl"
    utility = "utility"
    loan = "loan"
    credit_card = "credit_card"
    subscription = "subscription"
    rent = "rent"
    other = "other"


class DebtCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: DebtType
    amount: float = Field(gt=0)
    due_day: int = Field(ge=1, le=28)
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_installments: int | None = Field(default=None, ge=1, le=360)
    installments_paid: int | None = Field(default=None, ge=0)
    credit_limit: float | None = Field(default=None, ge=0)
    statement_balance: float | None = Field(default=None, ge=0)
    minimum_due: float | None = Field(default=None, ge=0)
    payment_card_id: int | None = None
    paid_this_month: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_installments(self):
        if self.installments_paid and self.total_installments is None:
            raise ValueError("total_installments is required when installments_paid is set")
        if (
            self.total_installments is not None
            and self.installments_paid is not None
            and self.installments_paid > self.total_installments
        ):
            raise ValueError("installments_paid cannot exceed total_installments")
        if self.type == DebtType.credit_card and self.payment_card_id is None:
            raise ValueError("Select a credit card from My Cards")
        return self


class DebtUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: DebtType | None = None
    amount: float | None = Field(default=None, gt=0)
    due_day: int | None = Field(default=None, ge=1, le=28)
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_installments: int | None = Field(default=None, ge=1, le=360)
    is_active: bool | None = None
    credit_limit: float | None = Field(default=None, ge=0)
    statement_balance: float | None = Field(default=None, ge=0)
    minimum_due: float | None = Field(default=None, ge=0)
    payment_card_id: int | None = None


class DebtResponse(BaseModel):
    id: int
    name: str
    type: DebtType
    amount: float
    due_day: int
    is_active: bool
    notes: str | None
    start_date: date
    end_date: date | None
    credit_limit: float | None
    statement_balance: float | None
    minimum_due: float | None
    payment_card_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OccurrenceStatus(str, Enum):
    paid = "paid"
    pending = "pending"
    overdue = "overdue"


class OccurrenceResponse(BaseModel):
    id: int
    debt_id: int
    debt_name: str
    debt_type: DebtType
    year: int
    month: int
    due_date: date
    amount: float
    scheduled_amount: float
    statement_balance: float | None
    minimum_due: float | None
    credit_limit: float | None
    is_paid: bool
    paid_at: datetime | None
    status: OccurrenceStatus

    model_config = {"from_attributes": True}


class OccurrenceUpdate(BaseModel):
    is_paid: bool | None = None
    amount: float | None = Field(default=None, gt=0)
    statement_balance: float | None = Field(default=None, ge=0)
    minimum_due: float | None = Field(default=None, ge=0)
