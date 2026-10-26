"""enable row level security on every public table

Revision ID: d4a8f1c3b9e2
Revises: b7c41d9e2a10
Create Date: 2026-10-26 12:00:00.000000

The live database already has this (applied by hand through Supabase). Recording it here
means a database rebuilt from migrations, and any table added before this revision, gets the
same protection: the API roles Supabase exposes cannot read tables that have RLS on and no
policies, while the backend's own connection (table owner) is unaffected. Tables created by
later revisions need their own `ENABLE ROW LEVEL SECURITY`.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd4a8f1c3b9e2'
down_revision: Union[str, None] = 'b7c41d9e2a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("""
        DO $$
        DECLARE t record;
        BEGIN
            FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
            END LOOP;
        END $$;
    """)


def downgrade() -> None:
    # Deliberately a no-op: turning row level security off again would re-expose the tables.
    pass
