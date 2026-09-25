# PostgreSQL Database Administrator

## What it changes

An agent asked to "add an index for this slow page" writes `CREATE INDEX`, runs
it, and reports that the page is faster. On a busy table that statement blocked
every write for the length of the build, nobody kept the plan that justified
it, and the next person will be afraid to drop it. Five things change with this
expert:

- **An index ships with its evidence.** `EXPLAIN (ANALYZE, BUFFERS)` before and
  after, committed as a file next to the migration; a drop ships with the usage
  statistics and the date they were reset.
- **No DDL without a `lock_timeout`.** Every migration sets one, the runner
  retries, and `squawk` lints the file before a person reads it. The lock each
  statement takes is looked up in the documentation, not remembered.
- **A backup is a restore somebody ran.** Recovery objectives written as
  numbers, a scheduled restore into a scratch instance, a verification script,
  and a dated record with the measured duration.
- **The application owns nothing.** Separate owner, migrator, application and
  read-only roles; SCRAM over TLS with the server verified; timeouts and
  connection limits per role.
- **The catalog is asked, not trusted.** Unvalidated constraints, invalid
  indexes, unindexed foreign keys, transaction ID age and abandoned replication
  slots are queries with alerts, not things somebody remembers to look at.

Six checklists and twelve refusals, pinned to PostgreSQL 18 with section
numbers, so every row can be traced to the paragraph it rests on.

## What it fits

- Taking over a PostgreSQL cluster and finding out what state it is in.
- A migration against a table large or busy enough that a lock is an outage.
- Adding, reviewing or removing an index.
- Writing the backup and restore runbook, and running the first restore test.
- Setting up roles, `pg_hba.conf` and TLS for a new application, or auditing an
  existing one.
- Diagnosing bloat, a stuck vacuum, connection exhaustion or an abandoned
  replication slot.

## What it does not fit

- **Designing a schema from nothing, or deciding how a change is split across
  deploys.** That is [`sql-data-engineer`](../sql-data-engineer/SKILL.md). Pair
  them: that expert decides the three deploys, this one checks what each
  statement locks and whether the result can be restored.
- **Pipelines, loads and data quality.** Also `sql-data-engineer`.
- **Other stores.** Lock modes, rewrite rules, backup tools and catalog views
  are PostgreSQL's own; on MySQL or SQL Server almost every row needs a
  different command, and the section numbers mean nothing.
- **A managed service that hides the server.** Where the provider owns
  `pg_hba.conf`, WAL archiving and superuser, the backup and access checklists
  shrink to asking the provider for evidence — still worth doing, but most of
  the commands here will not run.
- **High availability and failover design.** It watches replication slots; it
  does not choose a replication topology or a failover manager.
- **Security review of the application.** SQL injection in the code, the API's
  authorization, secrets in the build — that is
  [`security-reviewer`](../security-reviewer/SKILL.md).

## Pros and cons

**In its favour:** every rule produces an artefact — a plan file, a restore
record, a catalog query with an answer — so an agent following it can show it
did, and a reviewer can check without trusting either of them. The pin to one
major with section numbers makes the citations exact rather than approximately
right.

**Against it:** the pin is also its cost. Section numbers move between majors,
and the file is wrong the day the pin changes until somebody re-reads it. It is
`provenance: generated`: drafted from documentation and research, not from a
person's years on call, and nobody has yet run it against a production cluster
and reported what it caught. The restore-test discipline is real work, on real
infrastructure, and on a hobby project with a daily dump it is more ceremony
than the data is worth.
