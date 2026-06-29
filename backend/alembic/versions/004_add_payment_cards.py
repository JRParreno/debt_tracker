"""add payment_cards table

Revision ID: 004
Revises: 003
Create Date: 2026-06-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CARD_TYPE = postgresql.ENUM(
    "credit_card",
    "debit_card",
    "online_card",
    name="cardtype",
    create_type=False,
)


def upgrade() -> None:
    CARD_TYPE.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "payment_cards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nickname", sa.String(length=100), nullable=False),
        sa.Column("card_type", CARD_TYPE, nullable=False),
        sa.Column("credit_limit", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("balance", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("minimum_due", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("due_day", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payment_cards_id"), "payment_cards", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payment_cards_id"), table_name="payment_cards")
    op.drop_table("payment_cards")
    op.execute("DROP TYPE IF EXISTS cardtype")
