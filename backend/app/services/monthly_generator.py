import calendar
from datetime import date, datetime

from dateutil.relativedelta import relativedelta
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.debt import Debt, DebtOccurrence, DebtType


def compute_due_date(year: int, month: int, due_day: int) -> date:
    last_day = calendar.monthrange(year, month)[1]
    day = min(due_day, last_day)
    return date(year, month, day)


def compute_end_date_from_installments(
    start_date: date, total_installments: int, due_day: int
) -> date:
    last_month = start_date.replace(day=1) + relativedelta(
        months=total_installments - 1
    )
    return compute_due_date(last_month.year, last_month.month, due_day)


def iter_months_inclusive(start: date, end: date):
    year, month = start.year, start.month
    end_year, end_month = end.year, end.month
    while (year, month) <= (end_year, end_month):
        yield year, month
        month += 1
        if month > 12:
            month = 1
            year += 1


def debt_applies_to_month(debt: Debt, year: int, month: int) -> bool:
    if not debt.is_active:
        return False
    month_start = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    month_end = date(year, month, last_day)
    if debt.start_date > month_end:
        return False
    if debt.end_date and debt.end_date < month_start:
        return False
    return True


def occurrence_amounts_for_debt(debt: Debt) -> tuple[float | None, float | None, float]:
    """Returns (statement_balance, minimum_due, payment_amount) for a new occurrence."""
    if debt.type != DebtType.credit_card:
        return None, None, float(debt.amount)
    balance = float(debt.statement_balance) if debt.statement_balance is not None else None
    min_due = float(debt.minimum_due) if debt.minimum_due is not None else float(debt.amount)
    return balance, min_due, min_due


def insert_occurrence_if_missing(
    db: Session,
    *,
    debt_id: int,
    year: int,
    month: int,
    due_date: date,
    amount: float,
    scheduled_amount: float,
    statement_balance: float | None,
    minimum_due: float | None,
    is_paid: bool = False,
    paid_at: datetime | None = None,
) -> None:
    stmt = insert(DebtOccurrence).values(
        debt_id=debt_id,
        year=year,
        month=month,
        due_date=due_date,
        amount=amount,
        scheduled_amount=scheduled_amount,
        statement_balance=statement_balance,
        minimum_due=minimum_due,
        is_paid=is_paid,
        paid_at=paid_at,
    ).on_conflict_do_nothing(constraint="uq_debt_year_month")
    db.execute(stmt)


class MonthlyGenerator:
    def __init__(self, db: Session):
        self.db = db

    def ensure_occurrences_for_month(self, year: int, month: int) -> None:
        debts = self.db.query(Debt).filter(Debt.is_active.is_(True)).all()
        for debt in debts:
            if not debt_applies_to_month(debt, year, month):
                continue
            existing = (
                self.db.query(DebtOccurrence)
                .filter(
                    DebtOccurrence.debt_id == debt.id,
                    DebtOccurrence.year == year,
                    DebtOccurrence.month == month,
                )
                .first()
            )
            if existing:
                continue
            stmt_bal, min_due, pay_amount = occurrence_amounts_for_debt(debt)
            insert_occurrence_if_missing(
                self.db,
                debt_id=debt.id,
                year=year,
                month=month,
                due_date=compute_due_date(year, month, debt.due_day),
                amount=pay_amount,
                scheduled_amount=pay_amount,
                statement_balance=stmt_bal,
                minimum_due=min_due,
            )
        self.db.commit()

    def ensure_occurrences_for_range(
        self, start_year: int, start_month: int, months_ahead: int
    ) -> None:
        year, month = start_year, start_month
        for _ in range(months_ahead + 1):
            self.ensure_occurrences_for_month(year, month)
            month += 1
            if month > 12:
                month = 1
                year += 1

    def ensure_buffer_from_today(self, months_ahead: int = 2) -> None:
        today = date.today()
        self.ensure_occurrences_for_range(today.year, today.month, months_ahead)

    def ensure_debt_full_schedule(
        self, debt: Debt, installments_paid: int = 0
    ) -> None:
        """Backfill every month from start_date through end_date for fixed-term debts."""
        if not debt.end_date:
            self.ensure_buffer_from_today(months_ahead=2)
            return

        start_anchor = debt.start_date.replace(day=1)
        end_anchor = debt.end_date
        paid_count = max(0, installments_paid)
        index = 0

        for year, month in iter_months_inclusive(start_anchor, end_anchor):
            if not debt_applies_to_month(debt, year, month):
                continue

            existing = (
                self.db.query(DebtOccurrence)
                .filter(
                    DebtOccurrence.debt_id == debt.id,
                    DebtOccurrence.year == year,
                    DebtOccurrence.month == month,
                )
                .first()
            )
            mark_paid = index < paid_count
            index += 1

            if existing:
                if mark_paid and not existing.is_paid:
                    existing.is_paid = True
                    existing.paid_at = datetime.utcnow()
                continue

            stmt_bal, min_due, pay_amount = occurrence_amounts_for_debt(debt)
            insert_occurrence_if_missing(
                self.db,
                debt_id=debt.id,
                year=year,
                month=month,
                due_date=compute_due_date(year, month, debt.due_day),
                amount=pay_amount,
                scheduled_amount=pay_amount,
                statement_balance=stmt_bal,
                minimum_due=min_due,
                is_paid=mark_paid,
                paid_at=datetime.utcnow() if mark_paid else None,
            )

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()

    def resync_debt_schedule(self, debt: Debt) -> None:
        """After editing a debt: drop invalid months, fix due dates, fill gaps."""
        occurrences = (
            self.db.query(DebtOccurrence)
            .filter(DebtOccurrence.debt_id == debt.id)
            .all()
        )
        for occ in occurrences:
            if not debt_applies_to_month(debt, occ.year, occ.month):
                self.db.delete(occ)
            else:
                occ.due_date = compute_due_date(occ.year, occ.month, debt.due_day)

        today = date.today()
        if debt.end_date:
            range_end = debt.end_date
        else:
            future = today.replace(day=1) + relativedelta(months=2)
            last_day = calendar.monthrange(future.year, future.month)[1]
            range_end = date(future.year, future.month, last_day)

        start_anchor = debt.start_date.replace(day=1)

        for year, month in iter_months_inclusive(start_anchor, range_end):
            if not debt_applies_to_month(debt, year, month):
                continue
            existing = (
                self.db.query(DebtOccurrence)
                .filter(
                    DebtOccurrence.debt_id == debt.id,
                    DebtOccurrence.year == year,
                    DebtOccurrence.month == month,
                )
                .first()
            )
            if existing:
                continue
            stmt_bal, min_due, pay_amount = occurrence_amounts_for_debt(debt)
            insert_occurrence_if_missing(
                self.db,
                debt_id=debt.id,
                year=year,
                month=month,
                due_date=compute_due_date(year, month, debt.due_day),
                amount=pay_amount,
                scheduled_amount=pay_amount,
                statement_balance=stmt_bal,
                minimum_due=min_due,
            )

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
