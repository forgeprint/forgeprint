# Lock-safe DDL

What each statement locks, and for how long it may wait. How the change is
spread across deploys is [`sql-data-engineer`](../../sql-data-engineer/checklists/migration-safety.md)'s
checklist; this one is about the statements inside each deploy.

| #    | Check                                                                                              | How                                                                                                                               | Source                                            |
| ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| LD1  | Every migration file sets `lock_timeout` before its first DDL statement                            | `squawk` `require-lock-timeout` passes                                                                                            | PG18 §19.11.1; squawk 2.66.0                      |
| LD2  | The runner retries a lock timeout a bounded number of times with a pause, then fails loudly        | read the runner; force a timeout against a held lock in a scratch database                                                        | PG18 §13.3                                        |
| LD3  | Timeouts are set in the session, not in `postgresql.conf`                                          | grep the server configuration for `lock_timeout` and `statement_timeout`                                                          | PG18 §19.11.1                                     |
| LD4  | The lock each statement takes is written in the plan, looked up rather than remembered             | the migration plan has a lock column citing PG18 §13.3 or the command's page                                                      | PG18 §13.3                                        |
| LD5  | New foreign-key, `CHECK` and not-null constraints are added `NOT VALID`, then validated separately | `squawk` `constraint-missing-not-valid` passes; the `VALIDATE` is its own statement                                               | PG18 `ALTER TABLE`; squawk 2.66.0                 |
| LD6  | No statement that rewrites the table runs on a large table in place                                | check each `ADD COLUMN` default for volatility and each type change against the rewrite rules                                     | PG18 `ALTER TABLE`; squawk `changing-column-type` |
| LD7  | Indexes are created and dropped `CONCURRENTLY`, never inside a transaction                         | `squawk` `require-concurrent-index-creation`, `require-concurrent-index-deletion`, `ban-concurrent-index-creation-in-transaction` | PG18 `CREATE INDEX`; squawk 2.66.0                |
| LD8  | No `VACUUM FULL`, `CLUSTER` or plain `REINDEX` on a table serving traffic                          | grep the migrations and runbooks; use `REINDEX CONCURRENTLY`                                                                      | PG18 §13.3                                        |
| LD9  | Before a DDL deploy, long-running transactions are checked                                         | `pg_stat_activity` rows ordered by `xact_start`; output in the deploy log                                                         | PG18 §27.2.3                                      |
| LD10 | Every `squawk` rule disabled in a file carries a comment saying why                                | grep for the ignore directive; each has a reason on the line                                                                      | squawk 2.66.0                                     |

## Why each one

**LD1 and LD9 together.** A lock request waits indefinitely unless something
stops it. An `ALTER TABLE` waiting for `ACCESS EXCLUSIVE` behind a report that
has run for twenty minutes holds up every later query on that table while it
waits — an outage caused by a statement that has not started. The timeout turns
that into a failed migration, which is retried; the check before the deploy
means it usually does not happen at all.

**LD4** exists because lock levels are the thing people are most confident
about and most often wrong about. The table in PG18 §13.3 is the answer; memory
is not.

**LD6** is where a statement that is instant on a small table takes the large
one down. A volatile default rewrites the table and its indexes; a non-volatile
one does not. The difference is one function call in the `DEFAULT` clause.
