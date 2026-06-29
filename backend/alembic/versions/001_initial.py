"""initial

Revision ID: 001
Revises:
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEBT_TYPE = postgresql.ENUM(
    "bnpl",
    "utility",
    "loan",
    "credit_card",
    "subscription",
    "rent",
    "other",
    name="debttype",
    create_type=False,
)
PAY_FREQUENCY = postgresql.ENUM(
    "monthly",
    "semi_monthly",
    name="payfrequency",
    create_type=False,
)


def upgrade() -> None:
    DEBT_TYPE.create(op.get_bind(), checkfirst=True)
    PAY_FREQUENCY.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "debts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", DEBT_TYPE, nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("due_day", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_debts_id"), "debts", ["id"], unique=False)

    op.create_table(
        "income_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pay_frequency", PAY_FREQUENCY, nullable=False),
        sa.Column("monthly_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("pay_day", sa.Integer(), nullable=True),
        sa.Column("cutoff_1_day", sa.Integer(), nullable=True),
        sa.Column("cutoff_1_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("cutoff_2_day", sa.Integer(), nullable=True),
        sa.Column("cutoff_2_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_income_settings_id"), "income_settings", ["id"], unique=False)

    op.create_table(
        "debt_occurrences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("debt_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("is_paid", sa.Boolean(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["debt_id"], ["debts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("debt_id", "year", "month", name="uq_debt_year_month"),
    )
    op.create_index(op.f("ix_debt_occurrences_id"), "debt_occurrences", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_debt_occurrences_id"), table_name="debt_occurrences")
    op.drop_table("debt_occurrences")
    op.drop_index(op.f("ix_income_settings_id"), table_name="income_settings")
    op.drop_table("income_settings")
    op.drop_index(op.f("ix_debts_id"), table_name="debts")
    op.drop_table("debts")
    PAY_FREQUENCY.drop(op.get_bind(), checkfirst=True)
    DEBT_TYPE.drop(op.get_bind(), checkfirst=True)
