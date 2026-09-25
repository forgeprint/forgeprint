# Index evidence

An index is added with a plan and removed with statistics. The artefact for
each is a file in `db/plans/`, and a pull request without it is not reviewed.

| #   | Check                                                                                       | How                                                                            | Source                                 |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| IE1 | A new index has `db/plans/<index_name>.md` with the query, table row count, and both plans  | the file exists in the same pull request                                       | PG18 §14.1                             |
| IE2 | Both plans come from `EXPLAIN (ANALYZE, BUFFERS)` on production-sized data                  | read the header of each plan; buffer counts are present                        | PG18 §14.1                             |
| IE3 | A data-modifying statement was explained inside `BEGIN … ROLLBACK`                          | read how the plan was captured                                                 | PG18 §14.1                             |
| IE4 | The index is built `CONCURRENTLY`, outside a transaction block                              | read the migration; `squawk` `require-concurrent-index-creation` passes        | PG18 `CREATE INDEX`; squawk 2.66.0     |
| IE5 | Composite column order matches the predicate: equality columns before the range column      | compare the index definition with the `WHERE` clause of the named query        | Use The Index, Luke — The Where Clause |
| IE6 | The predicate does not wrap the indexed column in a function, or an expression index exists | read the `WHERE` clause                                                        | Use The Index, Luke — The Where Clause |
| IE7 | A top-N or paginated query has an index that also serves its `ORDER BY`                     | the plan shows no sort node above the index scan                               | Use The Index, Luke — Partial Results  |
| IE8 | An index proposed for removal shows `idx_scan = 0` since `stats_reset`, over a full cycle   | `pg_stat_user_indexes` joined to `pg_stat_database.stats_reset`, output pasted | PG18 §27.2.20                          |
| IE9 | It is not the only index enforcing a constraint                                             | `pg_constraint.conindid` does not point at it                                  | PG18 §5.5                              |

## Why each one

**IE1** is the whole rule. An index nobody can connect to a query is kept
forever out of fear, and slows every insert for the rest of the table's life.
The file is what lets the next person delete it with confidence — or keep it
with a reason.

**IE8** fails in a specific way: statistics reset on a crash or by hand, and an
index used only by a month-end report looks unused on the 20th. The reset date
and the observation window belong next to the number.

**IE9** stops the drop that looks safe: a unique index with zero scans is still
doing its job on every insert.
