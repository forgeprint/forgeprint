# Data quality

Every load runs twice. Every check below is a query you can run, and the report
is the queries plus their answers — numbers with no query behind them are not a
report.

| #    | Check                                                                                         | How                                                     | Source                  |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- |
| DQ1  | Loads are idempotent: a re-run changes nothing                                                | upsert keyed on something stable, not check-then-insert | Idempotence             |
| DQ2  | A batch has a recorded identity, so a re-run is detectable                                    | there is a table of runs                                | —                       |
| DQ3  | Partial failure leaves a known state: atomic, or a per-row status                             | read the failure path                                   | —                       |
| DQ4  | Row count is checked against an expectation, and zero rows is an alert                        | the check exists and fires                              | Silent empty load       |
| DQ5  | Null rate on required fields is measured per load                                             | the query exists                                        | —                       |
| DQ6  | Orphans are counted: child rows whose parent is missing                                       | the query exists and returns zero                       | Referential integrity   |
| DQ7  | Duplicates by natural key are counted                                                         | the query exists and returns zero                       | SD3                     |
| DQ8  | Numeric ranges are bounded — no negative quantity, no date in the far future                  | the checks exist                                        | —                       |
| DQ9  | Late and duplicate arrivals have a documented policy, decided before the pipeline was written | read the design                                         | —                       |
| DQ10 | No production data in a development environment; anonymisation is real, not a rename          | check the seeding path                                  | Privacy regulation; §5b |

## Why each one

**DQ4** is the failure that is invisible for a week. A load that processed zero
rows produced no error, wrote no rows and looked exactly like a quiet day. The
alert has to be on the expectation, not on the exception.

**DQ1 and DQ2 together** are what make a re-run safe rather than merely
survivable. Idempotence means the second run is harmless; the run table means
you can tell whether it happened at all.

**DQ10** is the one people rationalise. A copy of production in a development
database is the same data with fewer controls around it, and a breach there
counts exactly the same.
