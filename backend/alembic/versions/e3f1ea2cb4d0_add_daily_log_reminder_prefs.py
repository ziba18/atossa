"""add daily log reminder prefs

Revision ID: e3f1ea2cb4d0
Revises: a0aae4dc18c9
Create Date: 2026-08-14 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f1ea2cb4d0'
down_revision: Union[str, None] = 'a0aae4dc18c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'profiles',
        sa.Column('daily_log_reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        'profiles',
        sa.Column('daily_log_reminder_time', sa.String(), nullable=False, server_default='20:00'),
    )


def downgrade() -> None:
    op.drop_column('profiles', 'daily_log_reminder_time')
    op.drop_column('profiles', 'daily_log_reminder_enabled')
