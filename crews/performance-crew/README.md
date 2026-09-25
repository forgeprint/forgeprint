# Performance Crew

_Assembled by @aliosmanmho_

Four experts for making a PostgreSQL-backed web application faster by
measurement: see where the time goes, change one thing — in the browser or in
the database — and count nothing that moved less than the run-to-run spread.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                                      | What it brings                                                                   | The question it asks first                                    |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`observability-engineer`](../../experts/observability-engineer/SKILL.md)                   | Traces and logs that join, so the time can be attributed                         | Can we see one slow request from the browser to the query     |
| [`performance-engineer`](../../experts/performance-engineer/SKILL.md)                       | A baseline with its spread, one change, the same measurement again               | What is the run-to-run spread, before anyone changes anything |
| [`postgres-database-administrator`](../../experts/postgres-database-administrator/SKILL.md) | Query plans, an index that ships with its plan, DDL that cannot lock by surprise | What does the plan say, and what will this index lock         |
| [`frontend-engineer`](../../experts/frontend-engineer/SKILL.md)                             | Core Web Vitals at the 75th percentile and a byte budget                         | Is this slow in the field, or only in the lab                 |

**The checking role is `performance-engineer`.** The DBA and the frontend
engineer make the changes; the performance engineer measures each one against
the baseline it took first. A change whose effect is inside the spread is
reported as no result, whoever made it.

## What they install

| Integration                                                               | Why this crew wants it                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`chrome-devtools-mcp`](../../integrations/chrome-devtools-mcp/README.md) | Performance traces and the network log in a real browser      |
| [`sentry-mcp`](../../integrations/sentry-mcp/README.md)                   | Slow transactions and the release they started in             |
| [`postgres-mcp`](../../integrations/postgres-mcp/README.md)               | Plans, statistics and index health, in read-only transactions |

All three are third-party software. Run the Postgres server in its restricted
mode — without it, it can write — and against a replica or a copy, never the
primary. DevTools runs JavaScript in the pages it opens; Sentry events hold
user data. Read each README first.

## The order they are useful in

1. **Observability engineer first**: can one slow request be followed end to
   end? If not, that is the first fix, because every later measurement depends
   on it.
2. **Performance engineer second**: the baseline, the spread, and where the
   time actually goes. Only now is it known whether the browser or the
   database owns the problem.
3. **DBA or frontend engineer third** — whichever owns the bottleneck, not
   both at once. One change.
4. **Performance engineer again**: the same measurement. Keep the change if it
   beats the spread; revert it if not. Then back to step 2.

They disagree in two places, and the disagreement is useful:

- The DBA's index has a better plan; the performance engineer asks whether the
  request got faster. An index that improves a plan nobody's p95 depends on is
  write cost with no benefit.
- The frontend engineer's Lighthouse score improves in the lab; the
  performance engineer reads field data at the 75th percentile. Field wins.

## Why four, one change at a time

- Kim et al. measured sequential work getting 39% to 70% worse with more agents
  and errors amplifying 17.2 times across independent ones. Two members
  changing the system at once make both measurements worthless, so only one
  change is in flight.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  Here verification is a number with a spread, taken by a member that did not
  make the change.

## Where this crew is wrong

- **Feature work, or a correctness bug.** A wrong answer delivered faster is
  still wrong; take the debugger.
- **A single slow query that is already identified.** One sequential change:
  the DBA alone.
- **A stack without PostgreSQL.** The DBA member is pinned to it. The shape
  transfers; that member does not.

## How to use it

Ask your agent for the crew by name, and do not change anything until the
performance engineer has written down the baseline and its spread.
