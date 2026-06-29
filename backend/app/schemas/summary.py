from datetime import date

from pydantic import BaseModel


class MonthlySummaryItem(BaseModel):
    year: int
    month: int
    total: float
    paid: float
    unpaid: float


class CurrentSummary(BaseModel):
    year: int
    month: int
    total: float
    paid: float
    unpaid: float
    pending_count: int
    overdue_count: int
    total_income: float
    surplus: float


class StrategyDebtItem(BaseModel):
    id: int
    name: str
    amount: float
    due_date: date


class StrategyPeriod(BaseModel):
    label: str
    income: float
    debts_due: float
    remaining: float
    debts: list[StrategyDebtItem]


class StrategySummary(BaseModel):
    year: int
    month: int
    total_income: float
    total_debt_unpaid: float
    surplus: float
    periods: list[StrategyPeriod]
