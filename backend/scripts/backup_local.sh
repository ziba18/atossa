#!/usr/bin/env bash
# Owner-only weekly backup of Atossa's Postgres (gate 14; Supabase Free has no automatic backups:
# supabase.com/docs/guides/platform/backups, read 2026-10-28). Agents never run this on production.
#
#   export ATOSSA_BACKUP_DATABASE_URL='postgresql://...'   # typed in YOUR terminal; never in a file in the repo
#   bash backend/scripts/backup_local.sh /path/to/encrypted/folder
#
# 1. pg_dump (custom format, public schema = all Atossa tables) to <folder>/atossa-<UTC time>.dump, mode 600.
#    The folder must be OUTSIDE any git checkout (the dump is health data).
# 2. Restore test: starts a throwaway Postgres in a temp dir (unix socket only, no TCP), restores the dump,
#    prints row counts for users and health_records, then deletes the throwaway server.
# The connection string is never printed or written anywhere. Needs pg_dump/pg_restore/initdb/pg_ctl with a
# major version >= the server's (Supabase: check Settings > Infrastructure). Set PG_BIN to their folder if not on PATH.
set -euo pipefail
umask 077

die() { echo "backup: $*" >&2; exit 1; }

out_dir="${1:-}"
[ -n "$out_dir" ] || die "usage: bash backend/scripts/backup_local.sh <folder outside the repo>"
[ -d "$out_dir" ] || die "folder does not exist: $out_dir"
out_dir="$(cd "$out_dir" && pwd -P)"
# Walk up looking for .git ourselves: `git rev-parse` fails silently on a repo owned by another user.
d="$out_dir"
while :; do
  [ -e "$d/.git" ] && die "refused: $out_dir is inside a git checkout ($d); choose an encrypted folder outside any repo"
  [ "$d" = / ] && break
  d="$(dirname "$d")"
done
[ -n "${ATOSSA_BACKUP_DATABASE_URL:-}" ] || die "set ATOSSA_BACKUP_DATABASE_URL in your own terminal first (not in a file)"

bin() { if [ -n "${PG_BIN:-}" ]; then echo "$PG_BIN/$1"; else command -v "$1" || die "$1 not found (set PG_BIN)"; fi; }
PG_DUMP="$(bin pg_dump)"; PG_RESTORE="$(bin pg_restore)"; INITDB="$(bin initdb)"; PG_CTL="$(bin pg_ctl)"; PSQL="$(bin psql)"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump="$out_dir/atossa-$stamp.dump"
echo "backup: dumping to $dump"
# The URL goes to pg_dump through the environment of this one command only, never on stdout or in a file.
PGCONNECT_TIMEOUT=20 "$PG_DUMP" --format=custom --schema=public --no-owner --no-privileges \
  --file="$dump" --dbname="$ATOSSA_BACKUP_DATABASE_URL" || { rm -f "$dump"; die "pg_dump failed (nothing kept)"; }
chmod 600 "$dump"
echo "backup: dump done ($(du -h "$dump" | cut -f1))"

# --- restore test into a throwaway local server ---
tmp="$(mktemp -d)"
cleanup() { "$PG_CTL" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
"$INITDB" -D "$tmp/data" -U restore_check --auth=trust >/dev/null
"$PG_CTL" -D "$tmp/data" -o "-c listen_addresses='' -k $tmp" -l "$tmp/log" -w start >/dev/null
"$PSQL" -h "$tmp" -U restore_check -d postgres -qc "create database restore_check" >/dev/null
# A fresh database already has an empty public schema and the dump creates it, so drop it first;
# then any restore error is a real failure.
"$PSQL" -h "$tmp" -U restore_check -d restore_check -qc "drop schema public" >/dev/null
if ! "$PG_RESTORE" -h "$tmp" -U restore_check -d restore_check --no-owner --no-privileges --exit-on-error \
     "$dump" 2>"$tmp/restore.err"; then
  sed -n 1,20p "$tmp/restore.err" >&2
  die "restore test FAILED: the dump at $dump is not proven; do not delete older dumps"
fi
count() { "$PSQL" -h "$tmp" -U restore_check -d restore_check -Atqc "select count(*) from public.$1" 2>/dev/null || echo missing; }
users="$(count users)"; records="$(count health_records)"
echo "restore test: users=$users health_records=$records"
[ "$users" != missing ] && [ "$records" != missing ] || die "restore test FAILED: a core table is missing"
echo "backup: OK. Keep the last 4 weekly dumps; delete older ones (and any dump of a deleted account within 30 days)."
