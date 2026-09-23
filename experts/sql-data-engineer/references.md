# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist item rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-22.**

## The store

| Reference                                                                                                            | Version        | Checked    | Used for                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | -------------------------------------------------------------------------- |
| [PostgreSQL — data definition and constraints](https://www.postgresql.org/docs/current/ddl.html)                     | current stable | 2026-09-23 | `schema-design.md` SD2, SD5, SD8, SD10                                     |
| [PostgreSQL — ALTER TABLE, and what rewrites the table](https://www.postgresql.org/docs/current/sql-altertable.html) | current stable | 2026-09-23 | `migration-safety.md` M4, and the refusal of a one-step `NOT NULL` default |
| [PostgreSQL — CREATE INDEX CONCURRENTLY](https://www.postgresql.org/docs/current/sql-createindex.html)               | current stable | 2026-09-23 | `migration-safety.md` M6                                                   |
| [PostgreSQL — using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)                             | current stable | 2026-09-23 | `query-performance.md` Q3, Q4, Q5                                          |
| [PostgreSQL — INSERT and ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)                       | current stable | 2026-09-23 | `data-quality.md` DQ1                                                      |
| [PostgreSQL — date and time types](https://www.postgresql.org/docs/current/datatype-datetime.html)                   | current stable | 2026-09-23 | SD6, and the refusal of a zone-naive timestamp                             |
| [PostgreSQL — numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)                          | current stable | 2026-09-23 | SD7, and the refusal of float for money                                    |

The rules hold on any relational store; the syntax above does not. When
reviewing SQL Server, MySQL or SQLite, find the equivalent behaviour before
citing — table-rewrite rules and concurrent index creation differ between
stores, and that difference is exactly what `migration-safety.md` is about.

## The patterns

| Reference                                                                                                                                                                           | Version | Checked    | Used for                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------------------------------------ |
| [ParallelChange — expand and contract](https://martinfowler.com/bliki/ParallelChange.html)                                                                                          | current | 2026-09-23 | The three-deploy rule in SKILL.md and `migration-safety.md` M1 to M3                 |
| [Evolutionary database design](https://martinfowler.com/articles/evodb.html)                                                                                                        | current | 2026-09-23 | M7, M9, M10 — migrations ordered, immutable once merged, destructive steps separated |
| [Kimball Group — dimensional modelling techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) | current | 2026-09-23 | `schema-design.md` SD1, the grain sentence                                           |

## Deferred to elsewhere

- Access control on the data, secrets in connection strings, and what the logs
  give away: [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- Where the transaction boundary sits in application code, and whether a
  repository may commit: [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET. This expert owns the schema; that one owns the unit of work.
