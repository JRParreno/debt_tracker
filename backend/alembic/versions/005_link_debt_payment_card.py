"""link debts to payment_cards

Revision ID: 005
Revises: 004
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "debts",
        sa.Column("payment_card_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_debts_payment_card_id",
        "debts",
        "payment_cards",
        ["payment_card_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_debts_payment_card_id", "debts", type_="foreignkey")
    op.drop_column("debts", "payment_card_id")
