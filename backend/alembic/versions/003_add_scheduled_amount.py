"""add scheduled_amount to occurrences

Revision ID: 003
Revises: 002
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "debt_occurrences",
        sa.Column("scheduled_amount", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.execute("UPDATE debt_occurrences SET scheduled_amount = amount")
    op.alter_column("debt_occurrences", "scheduled_amount", nullable=False)


def downgrade() -> None:
    op.drop_column("debt_occurrences", "scheduled_amount")
