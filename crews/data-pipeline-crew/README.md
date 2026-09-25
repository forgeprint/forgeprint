# Data Pipeline Crew

_Assembled by @aliosmanmho_

Three experts for ELT and dbt pipelines into PostgreSQL: the grain of every
table written down, migrations and DDL that cannot take a lock by surprise,
and every load tested by running it twice.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                                      | What it brings                                                                  | The question it asks first                            |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`sql-data-engineer`](../../experts/sql-data-engineer/SKILL.md)                             | The model and its grain, migrations in three deploys, loads that assume a rerun | What is one row of this table                         |
| [`postgres-database-administrator`](../../experts/postgres-database-administrator/SKILL.md) | Lock-safe DDL, indexes with their plans, a backup somebody restored             | What will this statement lock, and for how long       |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)                           | Data tests that are deterministic, and a CI signal worth acting on              | Does the load produce the same result the second time |

**The checking role is `qa-automation-lead`.** It runs every load twice and
compares, holds the data-quality tests to the same determinism as any other
test, and decides what a red pipeline means. The data engineer builds the
pipeline; it does not grade it.

## What they install

| Integration                                                 | Why this crew wants it                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| [`github-mcp`](../../integrations/github-mcp/README.md)     | Models, migrations and their CI runs, reviewed as pull requests    |
| [`postgres-mcp`](../../integrations/postgres-mcp/README.md) | Schemas, plans and statistics, in read-only transactions           |
| [`dbt-mcp`](../../integrations/dbt-mcp/README.md)           | The dbt project parsed, listed and compiled, and its manifest read |

All three are third-party software. Run the Postgres server in restricted mode
and against a development database; dbt's compile can query the warehouse
through its profile. The GitHub token reaches every repository it can see.
Read each README first.

## The order they are useful in

1. **Data engineer first**: the grain of each model, keys and constraints, and
   loads written to be rerun.
2. **DBA second**, on every migration and index: the lock each statement takes,
   a `lock_timeout` on every DDL, the plan behind every index.
3. **QA lead third**: data-quality tests that fail on bad data, each load run
   twice with the results compared, and the pipeline's gate.

They disagree in two places, and the disagreement is useful:

- The data engineer indexes because a query asked; the DBA wants the plan that
  proves it. The same rule from two ends — ship the index with its plan.
- A bulk backfill the data engineer wants in one statement is a long lock and a
  bloated table to the DBA. Batch it, and let the DBA's runtime-health
  checklist say when it is done.

## Why three

- Kim et al. measured sequential work getting 39% to 70% worse with more
  agents. A pipeline change is sequential — model, migrate, test — so three
  members hand over in order.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  A load run twice and compared is the cheapest verification a pipeline has.

## Where this crew is wrong

- **Machine-learning modelling, or dashboards.** No member builds either.
- **A warehouse that is not PostgreSQL.** The DBA member is pinned to it.
- **A single query fix.** Small, sequential work for the data engineer alone.

## How to use it

Ask your agent for the crew by name, write the grain of each model down before
its first line of SQL, and do not merge a load that has only run once.
