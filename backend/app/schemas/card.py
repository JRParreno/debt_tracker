from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class CardType(str, Enum):
    credit_card = "credit_card"
    debit_card = "debit_card"
    online_card = "online_card"


class CardCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=100)
    card_type: CardType
    credit_limit: float | None = Field(default=None, ge=0)
    balance: float = Field(default=0, ge=0)
    minimum_due: float | None = Field(default=None, ge=0)
    due_day: int | None = Field(default=None, ge=1, le=28)

    @model_validator(mode="after")
    def validate_credit_fields(self):
        if self.card_type == CardType.credit_card:
            if self.credit_limit is not None and self.balance > self.credit_limit:
                raise ValueError("Balance cannot exceed credit limit")
        else:
            self.credit_limit = None
            self.minimum_due = None
            self.due_day = None
        return self


class CardUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=100)
    card_type: CardType | None = None
    credit_limit: float | None = Field(default=None, ge=0)
    balance: float | None = Field(default=None, ge=0)
    minimum_due: float | None = Field(default=None, ge=0)
    due_day: int | None = Field(default=None, ge=1, le=28)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_balance(self):
        if self.balance is not None and self.balance < 0:
            raise ValueError("Balance cannot be negative")
        return self


class CardResponse(BaseModel):
    id: int
    nickname: str
    card_type: CardType
    credit_limit: float | None
    balance: float
    minimum_due: float | None
    due_day: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
