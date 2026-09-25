# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read and the date of
that reading. **Re-check every 90 days**, and whenever the PostgreSQL pin moves.

> **Next re-check due: 2026-12-23.**

## The pin

PostgreSQL **18** is the pinned major: 18.6 was the current minor on
2026-09-24, and 19 was at Beta 4 the same day. Section numbers such as
`PG18 §13.3` refer to the version 18 documentation and are **not** stable
across majors — when moving the pin to 19, re-read every row below and update
the numbers, rather than assuming they carried over.

## PostgreSQL 18 documentation

| Reference                                                                                                                     | Version | Checked    | Used for                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------------------------------ |
| [Versioning policy and supported versions](https://www.postgresql.org/support/versioning/)                                    | 18.6    | 2026-09-24 | The pin; 18 supported until 2030-11-14                                         |
| [§5.5 Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html)                                                   | 18      | 2026-09-24 | SKILL §2; `catalog-integrity` CI1, CI4, CI5; `index-evidence` IE9              |
| [§5.8 Privileges](https://www.postgresql.org/docs/18/ddl-priv.html)                                                           | 18      | 2026-09-24 | SKILL §6; `catalog-integrity` CI8; `roles-and-access` RA3                      |
| [§5.9 Row Security Policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)                                         | 18      | 2026-09-24 | `roles-and-access` RA10 — enabled and forced, tested as the application role   |
| [§5.10 Schemas, §5.10.6 Usage Patterns](https://www.postgresql.org/docs/18/ddl-schemas.html)                                  | 18      | 2026-09-24 | `roles-and-access` RA4 — no public `CREATE`; clusters upgraded from before 15  |
| [§13.3 Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html)                                            | 18      | 2026-09-24 | SKILL §4; `lock-safe-ddl` LD2, LD4, LD8 — lock modes, and waits are indefinite |
| [§14.1 Using EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html)                                                  | 18      | 2026-09-24 | SKILL §3; `index-evidence` IE1–IE3 — `ANALYZE` implies `BUFFERS` in 18         |
| [§18.9 Secure TCP/IP Connections with SSL](https://www.postgresql.org/docs/18/ssl-tcp.html)                                   | 18      | 2026-09-24 | `roles-and-access` RA6                                                         |
| [§19.11 Client Connection Defaults](https://www.postgresql.org/docs/18/runtime-config-client.html)                            | 18      | 2026-09-24 | SKILL §4, §6; LD1, LD3; RA9; RH4 — timeouts, and not in `postgresql.conf`      |
| [§20.1 `pg_hba.conf`, §20.5 Password Authentication](https://www.postgresql.org/docs/18/auth-password.html)                   | 18      | 2026-09-24 | RA5 — `scram-sha-256`; MD5 deprecated in 18                                    |
| [§21 Database Roles](https://www.postgresql.org/docs/18/user-manag.html)                                                      | 18      | 2026-09-24 | SKILL §6; CI8; RA1, RA2, RA11                                                  |
| [§24.1 Routine Vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html)                                          | 18      | 2026-09-24 | SKILL §7; `runtime-health` RH1–RH3, RH5 — wraparound and long transactions     |
| [§25.3 Continuous Archiving and PITR](https://www.postgresql.org/docs/18/continuous-archiving.html)                           | 18      | 2026-09-24 | SKILL §5; `backup-and-restore` BR2, BR5                                        |
| [§27 Monitoring Database Activity](https://www.postgresql.org/docs/18/monitoring.html)                                        | 18      | 2026-09-24 | LD9; IE8; BR3; RH3, RH4, RH10                                                  |
| [§53.20 `pg_replication_slots`](https://www.postgresql.org/docs/18/view-pg-replication-slots.html)                            | 18      | 2026-09-24 | RH9                                                                            |
| [`ALTER TABLE`](https://www.postgresql.org/docs/18/sql-altertable.html)                                                       | 18      | 2026-09-24 | SKILL §2, §4; CI2; LD5, LD6 — `NOT VALID` for not-null in 18; rewrite rules    |
| [`CREATE INDEX`](https://www.postgresql.org/docs/18/sql-createindex.html)                                                     | 18      | 2026-09-24 | SKILL §3; CI3; IE4; LD7 — concurrent builds, and the invalid index they leave  |
| [`CREATE FUNCTION` — writing `SECURITY DEFINER` functions safely](https://www.postgresql.org/docs/18/sql-createfunction.html) | 18      | 2026-09-24 | RA11                                                                           |
| [`initdb`](https://www.postgresql.org/docs/18/app-initdb.html)                                                                | 18      | 2026-09-24 | CI6 — data checksums on by default in 18                                       |
| [`pg_verifybackup`](https://www.postgresql.org/docs/18/app-pgverifybackup.html)                                               | 18      | 2026-09-24 | SKILL §5; BR4, BR5 — "not a substitute for a test restore"                     |
| [§F.1 amcheck](https://www.postgresql.org/docs/18/amcheck.html)                                                               | 18      | 2026-09-24 | SKILL §2, §5; CI7; BR6                                                         |
| [§F.32 pg_stat_statements](https://www.postgresql.org/docs/18/pgstatstatements.html)                                          | 18      | 2026-09-24 | SKILL §7; RH8                                                                  |

## Indexing

| Reference                                                              | Version                  | Checked    | Used for                                                         |
| ---------------------------------------------------------------------- | ------------------------ | ---------- | ---------------------------------------------------------------- |
| [Use The Index, Luke — Markus Winand](https://use-the-index-luke.com/) | web edition, © 2010–2026 | 2026-09-24 | SKILL §3; IE5, IE6 ("The Where Clause"), IE7 ("Partial Results") |

The web edition is the free text of _SQL Performance Explained_ and is tested
across PostgreSQL releases up to 17 at the time of reading. The principles
carry to 18; the plan output shown there may differ in detail.

## Migration linting and pooling

| Reference                                                       | Version | Checked    | Used for                                                             |
| --------------------------------------------------------------- | ------- | ---------- | -------------------------------------------------------------------- |
| [squawk — rules](https://squawkhq.com/docs/rules)               | 2.66.0  | 2026-09-24 | SKILL §4; LD1, LD5–LD7, LD10; IE4 — rule names as published          |
| [squawk — releases](https://github.com/sbdchd/squawk/releases)  | 2.66.0  | 2026-09-24 | The pinned version (released 2026-09-23)                             |
| [PgBouncer — features](https://www.pgbouncer.org/features.html) | 1.26.0  | 2026-09-24 | SKILL §7; RH6, RH7 — the session features transaction pooling breaks |

PgBouncer 1.26.0 was released on 2026-09-23 and fixes three CVEs; anything
older than it should be upgraded before this checklist is applied.

## Data protection

OWASP ASVS is tracked in [`docs/review-standards.md`](../../docs/review-standards.md)
at **5.0.0**, with its own date; this expert does not keep a second copy. The
requirements below were read in the 5.0 source on 2026-09-24 so that the
numbers are exact.

| Requirement (ASVS 5.0)    | What it asks                                                                           | Used for      |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------- |
| V12.3.1, V12.3.2          | TLS on connections to and from the application; server certificates validated          | RA6           |
| V13.1.2                   | A maximum number of concurrent connections per service, and what happens at the limit  | RA9, RH6      |
| V13.2.1, V13.2.2, V13.2.3 | Individual service accounts, least privilege, no default credentials                   | RA1, RA2, RA7 |
| V13.3.1, V13.3.4          | Secrets in a vault, never in code; secrets expire and rotate                           | SKILL §6; RA8 |
| V14.1.1, V14.1.2          | Sensitive data identified and classified; protection requirements per level documented | CI9; BR1, BR7 |
| V14.2.4                   | Controls implemented to match each protection level                                    | BR8, BR10     |
| V14.2.7                   | Retention: outdated data deleted on a schedule                                         | BR9           |

## Deferred to elsewhere

- Deploy sequencing (expand, migrate, contract), loads and data quality:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md). The two share
  `stack: [postgres]` and nothing else — that expert decides how a change is
  split across deploys; this one decides what each statement is allowed to
  lock.
- Findings beyond the database boundary, and how a security review is written:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Where the backup job runs, its scheduler and its credentials in CI:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
