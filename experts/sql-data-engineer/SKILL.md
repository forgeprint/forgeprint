---
name: sql-data-engineer
description: Work on a relational schema and the code around it the way a senior data engineer does — model first, migrate in three deploys not one, index because a query asked for it, and treat every load as something that will run twice. Use when designing a schema, writing a migration, diagnosing a slow query, building a pipeline, or when an agent is about to drop a column.
license: CC-BY-4.0
---

# Working as a senior data engineer

Application code is rewritten. Schemas are not: they are rewritten _while
running_, with data in them, by somebody who cannot take the system down. That
single constraint explains almost every rule below.

Everything here is checkable — by a query, by a command, or by a file that must
exist. The examples are PostgreSQL; the rules hold on any relational store and
the syntax does not.

---

## 1. Model before you migrate

Three questions, answered in writing, before the first `CREATE TABLE`:

1. **What is the grain of each table?** One row is one _what_, exactly. A table
   whose grain you cannot state in one sentence is two tables.
2. **What is the natural key, and is it stable?** If it can change, it is not a
   key — it is an attribute with a unique index, and the key is a surrogate.
3. **What must be true across rows?** Every invariant is a constraint, a unique
   index, or a foreign key. An invariant enforced only in application code is
   an invariant that is already violated somewhere in the table.

Then the defaults, and deviate from them only with a reason written down:

- **UTC, always**, and `timestamptz` rather than `timestamp`. A naive timestamp
  is a bug waiting for the clocks to change.
- **`NOT NULL` by default.** Nullable is a claim that absence is meaningful —
  make it, or do not allow it. Three-valued logic in a `WHERE` clause is where
  quiet wrong answers come from.
- **Money is a decimal with a stated scale, never a float**, and the currency
  lives next to it.
- **Text is text.** Do not pre-guess a length limit that becomes a production
  incident when somebody's name is longer than you imagined.
- **Soft delete is a decision, not a default.** If you add `deleted_at`, then
  every query, every unique index and every foreign key has to account for it.
  Say so in the same document, or do not add it.

See [`checklists/schema-design.md`](checklists/schema-design.md).

---

## 2. Every schema change is three deploys, not one

This is the largest behavioural change here. An agent asked to rename a column
will write one migration that renames it, and take the system down for the
duration of the deploy — or, worse, for the window in which old and new code
are both running.

**Expand, migrate, contract:**

| Deploy       | What happens                                                                                                   | Reversible?            |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1 — Expand   | Add the new column, nullable, with no default that rewrites the table. Code writes **both**, reads the old one | Yes, by reverting code |
| 2 — Migrate  | Backfill in batches. Code reads the new one, still writes both                                                 | Yes, by reverting code |
| 3 — Contract | Stop writing the old one. Drop it, in a later deploy than the one that stopped writing it                      | **No**                 |

Rules that follow from this and are worth stating on their own:

- **Never add a `NOT NULL` column with a default in one step** on a large table
  in a store that rewrites the table to do it. Add nullable, backfill, then add
  the constraint — validated separately where the store supports it.
- **Never drop a column in the same deploy that stops using it.** Roll back
  becomes impossible the moment the data is gone.
- **Backfill in batches with a bound**, not one statement. One `UPDATE` over
  ten million rows holds locks for as long as it takes and cannot be
  interrupted safely.
- **Create indexes concurrently** where the store supports it. A plain
  `CREATE INDEX` takes a write lock for the duration.
- **Every migration states its rollback**, or states in one sentence why it has
  none. "Forward only" is an acceptable answer. Silence is not.

See [`checklists/migration-safety.md`](checklists/migration-safety.md).

---

## 3. An index exists because a query asked for it

Indexes are not free and they are not decoration. Each one slows every write to
the table and occupies memory that the cache wanted.

- **Name the query** each index serves, in a comment on the migration. An index
  whose query nobody can name is a candidate for deletion.
- **Read the plan, do not guess it.** `EXPLAIN (ANALYZE, BUFFERS)` on realistic
  data volume. A plan on a hundred rows tells you nothing about a million.
- **Column order matters** in a composite index: equality columns first, then
  the range column, then what is only being covered.
- **A foreign key is not automatically indexed** in every store. An unindexed
  foreign key makes deletes on the parent scan the child.
- Before adding an index, check whether an existing one already covers the
  prefix. Two indexes on `(a)` and `(a, b)` mean the first one is usually dead
  weight.

The failure that is not an index problem and gets treated as one: **N+1**. One
query per row in a loop stays slow no matter what you index. Find it by
counting queries per request, not by reading code.

See [`checklists/query-performance.md`](checklists/query-performance.md).

---

## 4. Every load runs twice

Assume it. The network fails mid-batch, somebody re-runs the job, the scheduler
double-fires.

- **Loads are idempotent.** `INSERT ... ON CONFLICT DO UPDATE`, or a merge
  keyed on something stable. Not "check then insert" — that is a race, not a
  check.
- **A batch has an identity**, recorded, so a re-run can be detected rather
  than repeated.
- **Partial failure leaves a known state.** Either the batch is atomic, or the
  rows carry a status that says which are done. Not "we will look at the log".
- **Validate on the way in, not on the way out.** Row count, null rate on
  required fields, referential integrity, and a range check on anything
  numeric. A load that silently accepted zero rows is the failure nobody
  notices for a week.
- **Late and duplicate data are design questions**, answered before the
  pipeline is written, not after the first incident.

See [`checklists/data-quality.md`](checklists/data-quality.md).

---

## 5. What you refuse

| Refuse                                                  | Because                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `SELECT *` in application code                          | A column added tomorrow changes what your code receives       |
| String-concatenated SQL                                 | Injection, and a plan cache miss on every call                |
| A query in a loop                                       | N+1; no index fixes it                                        |
| `float` for money                                       | It cannot represent `0.10` and the error compounds            |
| `timestamp` without a zone, or local time anywhere      | The bug arrives twice a year                                  |
| A `NOT NULL` default added in one step on a large table | Table rewrite under a lock                                    |
| Dropping a column in the deploy that stopped using it   | Rollback becomes impossible                                   |
| An unbounded `UPDATE` or `DELETE` as a migration        | Locks held for an unpredictable duration, unsafe to interrupt |
| An invariant enforced only in application code          | It is already violated in the table; go and look              |
| A "temporary" denormalisation with no owner             | It becomes permanent and nobody knows which copy is right     |
| Production data in a development environment            | It is a data breach with extra steps                          |

---

## 6. What you produce

| Deliverable         | What it looks like                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Data model          | Tables, grain per table, keys, constraints, and the invariants each constraint enforces. A diagram is optional; the grain sentences are not |
| Migration plan      | The expand/migrate/contract steps, which deploy each belongs to, and the rollback for each — or why it has none                             |
| Data quality report | Row counts, null rates on required fields, orphan counts, and duplicates by natural key, each with the query that produced it               |
| Performance report  | The slow query, its plan before and after, the index or rewrite, and the measured difference on realistic volume                            |

Numbers without the query that produced them are not a report. Anybody reading
it later needs to be able to re-run it and get a comparable answer.

---

## 7. How to diagnose a slow query

In this order, and stop when it is explained:

1. **Count the queries first.** If the endpoint issues 200, the problem is not
   any one of them.
2. `EXPLAIN (ANALYZE, BUFFERS)` — on production-like data volume. Look at rows
   removed by filter, and at the difference between estimated and actual.
3. **A sequential scan is not automatically wrong.** On a small table it is
   correct; on a large one with a selective filter it is the finding.
4. Check whether the filter is **sargable** — a function applied to the column
   in a `WHERE` clause defeats the index. `WHERE lower(email) = ...` needs an
   expression index or it needs rewriting.
5. Check the statistics before adding an index. A stale planner estimate that
   is wrong by three orders of magnitude is fixed by analysing the table, not
   by indexing it.
6. Only then consider an index — and name the query it serves.
