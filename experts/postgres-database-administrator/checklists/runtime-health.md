# Runtime health

The failures that build up for weeks and arrive all at once. Each row is an
alert, and each alert is committed with the query that fires it.

| #    | Check                                                                                                                    | How                                                                                                 | Source                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| RH1  | Transaction ID age is alerted on well before the server's own warnings                                                   | `SELECT datname, age(datfrozenxid) FROM pg_database` against a threshold                            | PG18 §24.1.5                       |
| RH2  | Autovacuum is on, and no table has it disabled without a written reason                                                  | `SHOW autovacuum`; `reloptions` on `pg_class` for `autovacuum_enabled=false`                        | PG18 §24.1.6                       |
| RH3  | Dead tuples and last autovacuum time are watched per large table                                                         | `n_dead_tup`, `last_autovacuum` in `pg_stat_all_tables`                                             | PG18 §24.1, §27.2.19               |
| RH4  | Sessions idle in a transaction are bounded by `idle_in_transaction_session_timeout` per role                             | `pg_roles.rolconfig`; `pg_stat_activity` where `state = 'idle in transaction'`                      | PG18 §19.11.1, §27.2.3             |
| RH5  | Long-running transactions are alerted on by `backend_xmin` age                                                           | `pg_stat_activity` ordered by `age(backend_xmin)`                                                   | PG18 §24.1.5                       |
| RH6  | Connections go through a pooler, and total server connections stay below `max_connections` with headroom for maintenance | PgBouncer configuration; `count(*)` from `pg_stat_activity` vs `max_connections`                    | PgBouncer 1.26.0; ASVS 5.0 V13.1.2 |
| RH7  | In transaction pooling, the application uses none of the session features the pooler breaks                              | grep the application for `SET` outside a transaction, `LISTEN`, session advisory locks, `WITH HOLD` | PgBouncer 1.26.0 — features        |
| RH8  | `pg_stat_statements` is loaded, and the top statements by total time are reviewed on a schedule                          | `shared_preload_libraries`; the review is dated                                                     | PG18 §F.32                         |
| RH9  | Replication slots are not holding WAL for a consumer that is gone                                                        | `pg_replication_slots`: `active = false`, `wal_status`, `safe_wal_size`                             | PG18 §53.20                        |
| RH10 | Lock waits are visible: blocked sessions and who blocks them                                                             | `pg_locks` joined to `pg_stat_activity`, or `pg_blocking_pids()`                                    | PG18 §27.3                         |

## Why each one

**RH1 and RH5** are one failure seen from two ends. An open transaction holds
back the horizon that vacuum can clean up to; left long enough, the server
stops accepting commands that assign transaction IDs until a database-wide
vacuum finishes. The documentation's first advice for that state is to find
and end the long-running transactions — which is why they are alerted on first.

**RH7** is the pooler failure that looks like an application bug. A `SET` in
transaction mode lands on one server connection and the next query runs on
another; the setting is simply not there, and nothing errors.

**RH9** fills a disk quietly. An abandoned slot keeps every WAL segment since
its consumer left, and the first symptom is the primary running out of space.
