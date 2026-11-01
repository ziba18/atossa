"""add users.must_change_password (PM-B150/B158: forced change after a one-time password)

Revision ID: a7c3e9f1b2d4
Revises: d1b6f3a85c27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a7c3e9f1b2d4'
down_revision: Union[str, None] = 'd1b6f3a85c27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
