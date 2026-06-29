"""add credit card fields

Revision ID: 002
Revises: 001
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "debts",
        sa.Column("credit_limit", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.add_column(
        "debts",
        sa.Column("statement_balance", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.add_column(
        "debts",
        sa.Column("minimum_due", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.add_column(
        "debt_occurrences",
        sa.Column("statement_balance", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.add_column(
        "debt_occurrences",
        sa.Column("minimum_due", sa.Numeric(precision=12, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("debt_occurrences", "minimum_due")
    op.drop_column("debt_occurrences", "statement_balance")
    op.drop_column("debts", "minimum_due")
    op.drop_column("debts", "statement_balance")
    op.drop_column("debts", "credit_limit")
