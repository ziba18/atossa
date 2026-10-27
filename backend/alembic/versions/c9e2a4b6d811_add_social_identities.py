"""add social_identities (Apple/Google subject per account)

Revision ID: c9e2a4b6d811
Revises: a7c3e9d2b4f1
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c9e2a4b6d811'
down_revision: Union[str, None] = 'a7c3e9d2b4f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'social_identities',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('provider', 'subject', name='uq_social_provider_subject'),
    )
    op.create_index('ix_social_identities_user_id', 'social_identities', ['user_id'])
    if op.get_bind().dialect.name == "postgresql":
        op.execute('ALTER TABLE public.social_identities ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    op.drop_index('ix_social_identities_user_id', table_name='social_identities')
    op.drop_table('social_identities')
