# Migration safety

A migration runs once, against real data, while the system is up, with the
previous version of the code still running somewhere. Every item here follows
from that sentence.

| #   | Check                                                                                         | How                                                          | Source                       |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| M1  | The change is decomposed into expand, migrate and contract, across separate deploys           | read the plan; one deploy that does all three is the finding | Expand/contract pattern      |
| M2  | Old and new code can both run against the schema at every point                               | for each deploy, ask what the previous version does          | Rolling deployment           |
| M3  | Nothing is dropped in the same deploy that stopped using it                                   | compare the code change with the migration                   | Rollback survivability       |
| M4  | No `NOT NULL` with a default added in one step on a large table                               | read the DDL; check the store's rewrite behaviour            | Table rewrite under lock     |
| M5  | Backfills run in bounded batches, resumable, not one statement                                | read the backfill                                            | Lock duration                |
| M6  | Indexes are created concurrently where the store supports it                                  | read the `CREATE INDEX`                                      | Write lock duration          |
| M7  | Every migration states its rollback, or why it has none                                       | read the header of each                                      | —                            |
| M8  | The migration has been run against a copy of production-sized data, and the duration recorded | the number exists                                            | —                            |
| M9  | Migrations are ordered, immutable once merged, and never edited in place                      | check the history                                            | Migration tooling convention |
| M10 | A destructive step is separated, reviewed on its own, and has a named person running it       | it is its own pull request                                   | —                            |

## Why each one

**M2** is the one that catches people who already know M1. Expand/contract is
not just about the schema being valid — it is about the _old_ code still
working against the new schema for the length of a rolling deploy. A column
renamed in step one breaks every instance that has not restarted yet.

**M5** matters more than it looks. A single large `UPDATE` cannot be
interrupted safely: killing it rolls back everything it did, so a job that is
90% done and taking too long leaves you with no good option.

**M8** is the item everybody skips and then regrets at 2am. A migration that
takes four seconds on a development database can take forty minutes on
production, and forty minutes is the difference between a deploy and an
incident.
