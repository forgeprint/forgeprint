# SQL Data Engineer

## What it changes

An agent asked to rename a column writes one migration that renames it. That
migration is correct, and it breaks every instance of the previous version of
the code that has not restarted yet. Four things change with this expert:

- **Every schema change is three deploys.** Expand, migrate, contract — with
  the deploy each step belongs to, and the rollback for each, or one sentence
  saying why there is none. Nothing is dropped in the deploy that stopped using
  it.
- **The grain of every table is one sentence** before the first `CREATE TABLE`,
  and every cross-row invariant is a constraint rather than a comment in the
  application.
- **An index exists because a query asked for it**, named in a comment, with a
  plan read on realistic volume. Queries are counted before any one of them is
  optimised, because an endpoint issuing two hundred is not fixed by making
  each one faster.
- **Every load is assumed to run twice.** Idempotent, batch identity recorded,
  partial failure leaving a known state, and a zero-row load treated as an
  alert rather than a quiet day.

Four checklists — schema design, migration safety, query performance, data
quality — and eleven refusals, from `SELECT *` to production data in a
development environment.

## What it fits

- Designing a relational schema, or changing one that already has rows in it.
- Writing a migration that will run against production while the system is up.
- Diagnosing a slow query, where the first useful question is how many queries
  there are.
- Building or reviewing a load, a pipeline or a scheduled job.
- PostgreSQL directly. The rules hold on SQL Server, MySQL and SQLite; the
  syntax does not, and `references.md` says to check the equivalent behaviour
  before citing.

## What it does not fit

- **Analytics modelling at warehouse scale.** The grain discipline transfers;
  star schemas, slowly changing dimensions and columnar stores are a different
  job with different tradeoffs.
- **Document and key-value stores.** Almost nothing here survives the move — no
  constraints, no joins, and an entirely different set of failure modes.
- **Database administration.** Replication, backup verification, connection
  pooling and capacity planning are an operator's work.
- **Data access code structure.** Where the transaction boundary sits belongs
  to an architect; this expert owns the schema.
- **A schema with no data in it yet.** Most of the migration discipline is
  overhead before the first deploy, and it will say so rather than impose three
  deploys on an empty table.

## Pros and cons

**In its favour:** it is built around the one constraint that actually shapes
the work — a schema is changed while it is running, with data in it, by
somebody who cannot take the system down. Every item follows from that rather
than from taste, which is why the checklists are queries you can run instead of
opinions you can disagree with.

**Against it:** the three-deploy rule is genuinely slower, and on a project
before launch it is ceremony. The examples are PostgreSQL-shaped, so a reader
on another store has to translate. And it handles the genuinely
situational things — soft delete, denormalisation — by demanding a written
reason rather than forbidding them, which is a cost somebody has to be willing
to pay.
