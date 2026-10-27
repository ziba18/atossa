"""add users.token_version

Revision ID: f5b2c7d1a9e3
Revises: d4a8f1c3b9e2
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f5b2c7d1a9e3'
down_revision: Union[str, None] = 'd4a8f1c3b9e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'token_version')
