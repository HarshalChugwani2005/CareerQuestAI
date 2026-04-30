"""irr milestone updates

Revision ID: 20260429_003
Revises: 20260429_002
Create Date: 2026-04-29 00:03:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260429_003"
down_revision = "20260429_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE milestonetype ADD VALUE IF NOT EXISTS 'offer_received'")
    op.add_column("loans", sa.Column("base_interest_rate", sa.Numeric(5, 2), nullable=True))
    op.create_unique_constraint("uq_milestones_student_type", "milestones", ["student_id", "type"])


def downgrade() -> None:
    op.drop_constraint("uq_milestones_student_type", "milestones", type_="unique")
    op.drop_column("loans", "base_interest_rate")
    # enum value downgrade requires manual handling in PostgreSQL
