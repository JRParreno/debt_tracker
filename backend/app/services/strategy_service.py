from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.debt import DebtOccurrence
from app.models.income import IncomeSettings, PayFrequency
from app.schemas.summary import StrategyDebtItem, StrategyPeriod, StrategySummary


def get_or_create_income(db: Session) -> IncomeSettings:
    income = db.query(IncomeSettings).first()
    if not income:
        income = IncomeSettings(
            pay_frequency=PayFrequency.monthly,
            monthly_amount=0,
            pay_day=15,
        )
        db.add(income)
        db.commit()
        db.refresh(income)
    return income


class StrategyService:
    def __init__(self, db: Session):
        self.db = db

    def get_strategy(self, year: int, month: int) -> StrategySummary:
        income = get_or_create_income(self.db)
        occurrences = (
            self.db.query(DebtOccurrence)
            .options(joinedload(DebtOccurrence.debt))
            .filter(
                DebtOccurrence.year == year,
                DebtOccurrence.month == month,
                DebtOccurrence.is_paid.is_(False),
            )
            .all()
        )

        total_debt_unpaid = sum(float(o.amount) for o in occurrences)
        periods: list[StrategyPeriod] = []

        if income.pay_frequency == PayFrequency.monthly:
            total_income = float(income.monthly_amount or 0)
            debt_items = [
                StrategyDebtItem(
                    id=o.id,
                    name=o.debt.name,
                    amount=float(o.amount),
                    due_date=o.due_date,
                )
                for o in sorted(occurrences, key=lambda x: x.due_date)
            ]
            pay_day = income.pay_day or 15
            periods.append(
                StrategyPeriod(
                    label=f"Monthly (day {pay_day})",
                    income=total_income,
                    debts_due=total_debt_unpaid,
                    remaining=total_income - total_debt_unpaid,
                    debts=debt_items,
                )
            )
        else:
            cutoff_1_day = income.cutoff_1_day or 15
            cutoff_2_day = income.cutoff_2_day or 28
            income_1 = float(income.cutoff_1_amount or 0)
            income_2 = float(income.cutoff_2_amount or 0)
            total_income = income_1 + income_2

            bucket_1: list[DebtOccurrence] = []
            bucket_2: list[DebtOccurrence] = []
            for o in occurrences:
                if o.debt.due_day <= cutoff_1_day:
                    bucket_1.append(o)
                else:
                    bucket_2.append(o)

            debts_1 = [
                StrategyDebtItem(
                    id=o.id,
                    name=o.debt.name,
                    amount=float(o.amount),
                    due_date=o.due_date,
                )
                for o in sorted(bucket_1, key=lambda x: x.due_date)
            ]
            debts_2 = [
                StrategyDebtItem(
                    id=o.id,
                    name=o.debt.name,
                    amount=float(o.amount),
                    due_date=o.due_date,
                )
                for o in sorted(bucket_2, key=lambda x: x.due_date)
            ]
            due_1 = sum(float(o.amount) for o in bucket_1)
            due_2 = sum(float(o.amount) for o in bucket_2)

            periods.append(
                StrategyPeriod(
                    label=f"Cutoff 1 (day {cutoff_1_day})",
                    income=income_1,
                    debts_due=due_1,
                    remaining=income_1 - due_1,
                    debts=debts_1,
                )
            )
            periods.append(
                StrategyPeriod(
                    label=f"Cutoff 2 (day {cutoff_2_day})",
                    income=income_2,
                    debts_due=due_2,
                    remaining=income_2 - due_2,
                    debts=debts_2,
                )
            )

        total_income = sum(p.income for p in periods) if periods else 0

        return StrategySummary(
            year=year,
            month=month,
            total_income=total_income,
            total_debt_unpaid=total_debt_unpaid,
            surplus=total_income - total_debt_unpaid,
            periods=periods,
        )
