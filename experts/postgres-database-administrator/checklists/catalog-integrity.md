# Catalog integrity

Ask the system catalog, not the documentation and not the ORM. Each row is a
query whose answer goes into `db/baseline/<YYYY-MM-DD>.md`.

| #   | Check                                                                                      | How                                                                                                | Source                      |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------- |
| CI1 | Every table has a primary key                                                              | `pg_class` relations with no `pg_constraint` row of `contype = 'p'`                                | PG18 §5.5.4                 |
| CI2 | No constraint is left unvalidated                                                          | `SELECT conrelid::regclass, conname FROM pg_constraint WHERE NOT convalidated` returns nothing     | PG18 `ALTER TABLE`          |
| CI3 | No index is invalid                                                                        | `pg_index` rows with `indisvalid = false` — each is a failed concurrent build still costing writes | PG18 `CREATE INDEX`         |
| CI4 | Every foreign key has an index on the referencing columns                                  | compare `pg_constraint.conkey` of each `contype = 'f'` with the leading columns in `pg_index`      | PG18 §5.5.5                 |
| CI5 | Invariants the application relies on appear as `CHECK`, `UNIQUE` or exclusion constraints  | list the invariants from the code; find each one in `pg_constraint`                                | PG18 §5.5.1, §5.5.3, §5.5.6 |
| CI6 | Data checksums are on                                                                      | `SHOW data_checksums` is `on`                                                                      | PG18 `initdb`               |
| CI7 | B-tree indexes behind unique constraints pass `amcheck` after any storage event or upgrade | `bt_index_check(index, heapallindexed => true)` on each; output committed                          | PG18 §F.1                   |
| CI8 | Every schema and table has a named owner role, and it is not a login role                  | `\dn+`, `\dt+`; the owner has `rolcanlogin = false`                                                | PG18 §5.8; §21.1            |
| CI9 | Sensitive columns are listed and classified                                                | a table of schema, column and protection level, kept with the data model                           | ASVS 5.0 V14.1.1            |

## Why each one

**CI2** is the one left behind by the correct procedure. Adding a constraint
`NOT VALID` and validating it later is the safe way to change a large table —
and "later" is where it gets forgotten. The constraint then guards new rows and
silently vouches for none of the old ones.

**CI3** costs nothing to find and is almost never looked for. A concurrent
build that failed leaves an index the planner ignores and every write still
maintains.

**CI7** is how you learn an index disagrees with its table before a unique
constraint quietly stops being unique. Run it after the events that cause
corruption, not on a whim — it reads the whole index.
