# Weekly backup — owner card (gate 14)
Supabase Free makes no automatic backups (supabase.com/docs/guides/platform/backups, read 2026-10-28), so the owner runs this
once a week on their own laptop. Agents never run it against production.

1. **Where:** an encrypted folder outside every git checkout (FileVault/BitLocker), plus one encrypted copy on a second drive.
   Never GitHub, email or a public cloud drive: the dump is health data. The script refuses a folder inside a repo.
2. **Connection string:** Supabase dashboard > Connect > URI (session pooler). Type it into YOUR terminal only:
   ```
   read -rs ATOSSA_BACKUP_DATABASE_URL && export ATOSSA_BACKUP_DATABASE_URL   # paste, Enter (nothing is shown)
   bash backend/scripts/backup_local.sh ~/Encrypted/atossa-backups
   unset ATOSSA_BACKUP_DATABASE_URL
   ```
   Needs Postgres client tools with a major version >= the server's (macOS: `brew install postgresql@17`, then
   `PG_BIN=$(brew --prefix postgresql@17)/bin`).
3. **What it prints:** the dump path and size, then `restore test: users=N health_records=N` from a throwaway local Postgres
   that is deleted straight after. `backup: OK` = the dump is proven. `restore test FAILED` = keep your older dumps.
4. **Keep:** the last 4 weekly dumps; delete older ones; delete any dump holding an account that was deleted, within 28 days
   (Finance backup-card item 3; retention = Safety C166, 1 Nov: 4 weekly dumps, up to 28 days after deletion; owner confirms).
5. **Scope:** `public` schema only (every Atossa table). Basket Buddy users live in a separate Supabase project and are not in it.

Dry run done by AI Brain (PM-B147, 1 Nov 2026) against a local Postgres 16 seeded by `alembic upgrade head` + synthetic rows
(3 users, 25 records): `restore test: users=3 health_records=25`, dump mode 600; refused in-repo folder, missing folder,
unset variable; unreachable server -> `pg_dump failed (nothing kept)`, no file left. shellcheck clean.

Second dry run (PM-B151, AI Brain run57, 1 Nov 2026 03:30 UTC): throwaway Postgres 16 (`initdb -A trust`, unix socket
`/tmp`, port 5491, no TCP), seeded by hand with 3 `users` + 25 `health_records` rows (synthetic, `@example.org`), run as a
non-root user. Never prod. Output:
```
backup: dumping to /home/pgtest/out/atossa-20261101T033036Z.dump
backup: dump done (8.0K)
restore test: users=3 health_records=25
backup: OK. Keep the last 4 weekly dumps; delete older ones (and any dump holding a deleted account within 28 days, Safety C166).
```
Source counts (`psql` on the seeded DB): users=3, health_records=25 -> **restore row counts match**. Dump file mode `-rw-------`.

**Step 0 (PM-B153):** do not run this on real patient data until the /privacy text that names the 28-day backup window is live
(branch `claude/ai-brain-support-email`, waiting for Safety C175's sentence).
