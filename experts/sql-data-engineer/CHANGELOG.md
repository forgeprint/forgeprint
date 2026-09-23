# Changelog

## 1.0.0 — 2026-09-23

The catalog's third expert, built around the one constraint that shapes the
work: a schema is changed while it is running, with data in it, by somebody who
cannot take the system down.

- Expand, migrate, contract — three deploys, with the rollback for each or one
  sentence saying why there is none. Nothing is dropped in the deploy that
  stopped using it.
- The grain of every table stated in one sentence before the first
  `CREATE TABLE`; every cross-row invariant a constraint rather than a comment
  in the application.
- An index exists because a query asked for it, named in a comment, with a plan
  read on realistic volume. Queries are counted before any one of them is
  optimised.
- Every load assumed to run twice: idempotent, batch identity recorded, and a
  zero-row load treated as an alert rather than a quiet day.
- Eleven refusals, and four checklists whose items are queries rather than
  opinions.

PostgreSQL in the examples. `references.md` says to find the equivalent
behaviour before citing on another store, because table-rewrite rules and
concurrent index creation are exactly where stores differ.
