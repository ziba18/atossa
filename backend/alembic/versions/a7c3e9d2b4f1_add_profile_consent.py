"""add profiles.consent_version and consented_at

Revision ID: a7c3e9d2b4f1
Revises: f5b2c7d1a9e3
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a7c3e9d2b4f1'
down_revision: Union[str, None] = 'f5b2c7d1a9e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('consent_version', sa.Integer(), nullable=True))
    op.add_column('profiles', sa.Column('consented_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'consented_at')
    op.drop_column('profiles', 'consent_version')
