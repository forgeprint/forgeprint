# Query performance

Diagnose in order, and stop when it is explained. Most of what is blamed on
indexing is not an indexing problem.

| #   | Check                                                               | How                                                                             | Source             |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------ |
| Q1  | Count the queries per request before looking at any one of them     | instrument, or read the query log                                               | N+1                |
| Q2  | No query is issued inside a loop over rows                          | read the data access path                                                       | N+1                |
| Q3  | The plan was read, on production-like volume, not guessed           | `EXPLAIN (ANALYZE, BUFFERS)`; a plan on a hundred rows proves nothing           | —                  |
| Q4  | Estimated and actual row counts are within an order of magnitude    | compare them in the plan; a large gap is a statistics problem, not an index one | Planner statistics |
| Q5  | Filters are sargable — no function wrapping the indexed column      | read the `WHERE` clause                                                         | Index usability    |
| Q6  | Every index names the query it serves, in a comment                 | read the migration                                                              | —                  |
| Q7  | No redundant index: nothing is a prefix of another                  | query the catalog and compare column lists                                      | Write cost         |
| Q8  | Composite index order is equality, then range, then covered columns | compare the index to the query                                                  | —                  |
| Q9  | No `SELECT *` in application code                                   | grep                                                                            | Column drift       |
| Q10 | Read-only paths do not take write locks or track entities           | read the ORM configuration for those paths                                      | —                  |
| Q11 | Result sets are bounded — pagination or an explicit limit           | read every list endpoint                                                        | Unbounded growth   |

## Why each one

**Q1 before everything.** An endpoint issuing 200 queries is not fixed by
making each one faster, and an afternoon spent on the plan of one of them is an
afternoon wasted. Count first.

**Q4** is the most commonly misdiagnosed. A plan choosing a sequential scan
because it thinks the filter matches a million rows, when it matches twelve, is
a statistics problem. Adding an index does not fix it — the planner will ignore
the index for the same wrong reason.

**Q7** costs nothing to check and pays every write. Two indexes where one would
do means every insert maintains both, for the lifetime of the table.
