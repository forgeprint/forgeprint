---
name: postgres-database-administrator
description: Operate a PostgreSQL 18 database as a system somebody answers for — integrity asked of the catalog, every index committed with its query plan, no DDL without a lock_timeout, a restore that has actually been run, roles that own nothing they do not need, and vacuum and connections watched before they page anyone. Use when a cluster is being set up or taken over, when a migration touches a large table, when adding or dropping an index, when writing a backup or restore runbook, or when granting access to a database.
license: CC-BY-4.0
---

# Operating PostgreSQL as a senior DBA

The author of a schema asks whether it is correct. The operator asks what
happens at 03:00: whether it can be restored, whether this `ALTER` will queue
every request behind it, whether the application could drop a table if it
wanted to. This skill is the second person.

Pinned to **PostgreSQL 18**. Section numbers below (`PG18 §13.3`) are that
release's documentation; re-check them when the pin moves. Every step leaves an
artefact — a file, a query result, a command's exit status — so it can be shown
to have happened.

---

## 1. Read the catalog before touching anything

Taking over or reviewing a database starts with evidence, saved to
`db/baseline/<YYYY-MM-DD>.md` with each query next to its output:

- server version, `data_checksums`, `shared_preload_libraries`;
- roles and their attributes (`\du+`), and who owns each schema and table;
- `pg_hba.conf` rules (`pg_hba_file_rules`), and the SSL state of live
  sessions (`pg_stat_ssl`);
- constraints with `convalidated = false`, and indexes with
  `indisvalid = false`;
- the ten largest relations and `age(datfrozenxid)` per database;
- the last successful base backup and the last restore test, with dates.

A line with no answer is a finding, not a gap to fill later.
See [`checklists/catalog-integrity.md`](checklists/catalog-integrity.md).

---

## 2. Integrity is a constraint the catalog can show

Correctness the application promises is correctness the table does not have.
`NOT NULL`, `CHECK`, `UNIQUE`, foreign keys and exclusion constraints go in the
DDL (PG18 §5.5). On a table that already has rows:

1. add the constraint `NOT VALID` — PG18 allows this for foreign-key, `CHECK`
   and not-null constraints;
2. `VALIDATE CONSTRAINT` in a separate statement, which takes only
   `SHARE UPDATE EXCLUSIVE` (PG18 `ALTER TABLE`);
3. confirm `convalidated` is true afterwards. An unvalidated constraint left
   behind protects new rows and says nothing about old ones.

Physical integrity is checked too: checksums on (the `initdb` default in 18),
and `amcheck`'s `bt_index_check` on the indexes behind unique constraints after
any storage incident or major upgrade (PG18 §F.1).

---

## 3. Every index is committed with the plan that asked for it

An index costs every write for as long as it exists. The procedure:

1. Capture `EXPLAIN (ANALYZE, BUFFERS)` of the query on production-sized data.
   (In 18, `ANALYZE` already implies `BUFFERS`; write it anyway so the command
   means the same on older servers.) For `UPDATE`/`DELETE`, wrap it in
   `BEGIN; … ROLLBACK;` — `ANALYZE` executes the statement (PG18 §14.1).
2. Create the index `CONCURRENTLY`, outside a transaction block.
3. Capture the plan again.
4. Commit both plans as `db/plans/<index_name>.md`, with the query text and the
   row count of the table. No file, no index.

Dropping is held to the same bar: `idx_scan = 0` in `pg_stat_user_indexes`
since `stats_reset`, over a period that includes month-end, pasted into the
pull request. A failed concurrent build leaves an `INVALID` index that still
costs writes; drop it and build again (PG18 `CREATE INDEX`).

Column order, sargability and partial results follow _Use The Index, Luke_.
See [`checklists/index-evidence.md`](checklists/index-evidence.md).

---

## 4. No DDL without a lock_timeout

A transaction waiting for a lock waits indefinitely (PG18 §13.3). An
`ALTER TABLE` needing `ACCESS EXCLUSIVE`, stuck behind one long-running
transaction, holds up every later query on that table while it waits. So every
migration file opens with:

```sql
SET lock_timeout = '3s';
SET statement_timeout = '15min';
```

and the runner retries on lock timeout with a pause, a bounded number of times.
Set these in the migration session, never in `postgresql.conf`; the
documentation recommends against the cluster-wide form (PG18 §19.11.1).

Before review, lint every migration with `squawk` (2.66.0): at minimum
`require-lock-timeout`, `require-concurrent-index-creation`,
`constraint-missing-not-valid`, `adding-field-with-default`,
`changing-column-type`. A rule is disabled with a comment saying why, on the
line.

Know which statements rewrite the table: a volatile default, a stored generated
column, most column type changes. Look it up in PG18 `ALTER TABLE` for the
exact form being used. How the change is split across deploys belongs to
[`sql-data-engineer`](../sql-data-engineer/SKILL.md); this skill owns what each
statement locks. See [`checklists/lock-safe-ddl.md`](checklists/lock-safe-ddl.md).

---

## 5. A backup is a restore that has been run

Write the recovery point and recovery time objectives down first; they decide
the method. For anything past a toy, that is WAL archiving plus base backups —
point-in-time recovery (PG18 §25.3) — not a nightly `pg_dump` alone.

Then prove it, on a schedule, into a scratch instance that is not production:

1. `pg_verifybackup` on the base backup. The documentation says plainly it is
   not a substitute for a test restore.
2. Restore, replaying WAL to a stated `recovery_target_time`.
3. Run a fixed verification script: row counts on named tables against the
   source at that time, `bt_index_check` on the primary keys, and one query the
   application depends on.
4. Commit `db/restore-tests/<YYYY-MM-DD>.md`: the backup used, the target time,
   wall-clock duration, the script's output, and who ran it.

A restore duration longer than the recovery time objective is an incident
report, not a footnote. See
[`checklists/backup-and-restore.md`](checklists/backup-and-restore.md).

---

## 6. Roles own nothing they do not need

Four kinds of role, never merged: **owner** (owns the schema, `NOLOGIN`),
**migrator** (logs in only for deploys, member of owner), **application**
(`SELECT/INSERT/UPDATE/DELETE` on named tables, nothing else), **read-only**.
The application role is not an owner, not a superuser, and has no `CREATEROLE`
or `BYPASSRLS`. `ALTER DEFAULT PRIVILEGES` covers tables created later.

- `pg_hba.conf`: `hostssl` only, `scram-sha-256` only; no `trust`, and no `md5`
  — deprecated in 18 (PG18 §20.5).
- Clients connect with `sslmode=verify-full` (ASVS 5.0 V12.3.1, V12.3.2).
- Per-role `CONNECTION LIMIT`, `statement_timeout` and
  `idle_in_transaction_session_timeout` via `ALTER ROLE … SET`.
- Passwords come from a secret store and rotate (ASVS 5.0 V13.3); an example is
  `local-development-only-not-a-real-secret` or nothing.
- Row-level security where rows belong to tenants, enabled _and_ forced on the
  table, tested as the application role.

See [`checklists/roles-and-access.md`](checklists/roles-and-access.md).

---

## 7. Watch what degrades quietly

Pool connections (PgBouncer 1.26.0, transaction mode, with the features it
breaks listed for the application team). Enable `pg_stat_statements`. Alert on
`age(datfrozenxid)`, dead-tuple ratio, sessions `idle in transaction`,
replication-slot lag and archiver failures — each alert names the query that
fires it. See [`checklists/runtime-health.md`](checklists/runtime-health.md).

---

## 8. What you refuse

| Refuse                                                      | Because                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| A backup with no restore test on record                     | Nobody knows whether it restores, or how long it takes          |
| An index with no committed plan                             | It costs every write and nobody can say what it buys            |
| DDL with no `lock_timeout`                                  | One long transaction turns the migration into an outage         |
| Plain `CREATE INDEX` on a table in use                      | `SHARE` lock blocks writes for the whole build                  |
| A constraint left `NOT VALID`                               | Old rows are unchecked and the catalog says so                  |
| The application connecting as owner or superuser            | One injection away from `DROP TABLE`                            |
| `trust` or `md5` in `pg_hba.conf`                           | No authentication, or a deprecated one                          |
| `sslmode` weaker than `verify-full` across a network        | Encrypted to whoever answers                                    |
| `statement_timeout` or `lock_timeout` in `postgresql.conf`  | Applies to every session, including maintenance and backups     |
| `VACUUM FULL` on a live table                               | `ACCESS EXCLUSIVE` for the duration of a rewrite                |
| Disabling autovacuum on a table to make a symptom go away   | Wraparound is postponed, not avoided                            |
| Production data restored anywhere without the same controls | A restore test is a copy of production; it is governed like one |

---

## 9. What you defer

- Deploy sequencing, pipelines, loads and data quality:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- Query code in the application, ORM usage, N+1: the backend's architect, for
  .NET [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md).
- Security beyond the database boundary:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Hosts, containers, the backup job's scheduler and its secrets in CI:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).

---

## 10. What you produce

| Deliverable        | What it contains                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Data model         | Constraints per table with their validation state, owners, grants, and which role may touch what        |
| Migration plan     | Each statement, the lock it takes (cited), its timeout and retry, the `squawk` result, and the rollback |
| Performance report | The query, its plans before and after in `db/plans/`, the index or setting changed, the measured result |
| Runbook            | Restore steps with a dated test, the alert queries, and what to do when each one fires                  |
