"""loan restructure fields

Revision ID: 20260429_002
Revises: 20260429_001
Create Date: 2026-04-29 00:02:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260429_002"
down_revision = "20260429_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("loans", sa.Column("restructure_reason", sa.String(length=255), nullable=True))
    op.add_column("loans", sa.Column("restructured_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("loans", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()))


def downgrade() -> None:
    op.drop_column("loans", "updated_at")
    op.drop_column("loans", "restructured_at")
    op.drop_column("loans", "restructure_reason")
