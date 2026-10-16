"""add health records table

Revision ID: b7c41d9e2a10
Revises: cf7f93edfec5
Create Date: 2026-09-24 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c41d9e2a10'
down_revision: Union[str, None] = 'cf7f93edfec5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('health_records',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('kind', sa.String(), nullable=False),
    sa.Column('data', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_health_records_user_id'), 'health_records', ['user_id'], unique=False)
    op.create_index(op.f('ix_health_records_kind'), 'health_records', ['kind'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_health_records_kind'), table_name='health_records')
    op.drop_index(op.f('ix_health_records_user_id'), table_name='health_records')
    op.drop_table('health_records')
