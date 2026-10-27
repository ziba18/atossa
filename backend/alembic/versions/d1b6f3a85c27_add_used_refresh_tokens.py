"""add used_refresh_tokens (reuse detection for refresh tokens)

Revision ID: d1b6f3a85c27
Revises: c9e2a4b6d811
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd1b6f3a85c27'
down_revision: Union[str, None] = 'c9e2a4b6d811'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'used_refresh_tokens',
        sa.Column('jti', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_used_refresh_tokens_user_id', 'used_refresh_tokens', ['user_id'])
    op.create_index('ix_used_refresh_tokens_expires_at', 'used_refresh_tokens', ['expires_at'])
    if op.get_bind().dialect.name == "postgresql":
        op.execute('ALTER TABLE public.used_refresh_tokens ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    op.drop_index('ix_used_refresh_tokens_expires_at', table_name='used_refresh_tokens')
    op.drop_index('ix_used_refresh_tokens_user_id', table_name='used_refresh_tokens')
    op.drop_table('used_refresh_tokens')
