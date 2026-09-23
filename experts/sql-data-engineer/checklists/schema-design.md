# Schema design

The schema outlives the application. Everything here is cheap now and expensive
once there are rows.

| #    | Check                                                                                  | How                                                   | Source                        |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| SD1  | Every table's grain is one sentence: one row is one _what_                             | write it; a table needing two sentences is two tables | Dimensional modelling         |
| SD2  | Every table has a primary key                                                          | query the catalog for tables without one              | Relational fundamentals       |
| SD3  | A natural key that can change is a unique index, not the key                           | ask whether it can ever be edited                     | —                             |
| SD4  | Columns are `NOT NULL` unless absence is meaningful, and then it is documented         | count nullable columns and justify each               | Three-valued logic in `WHERE` |
| SD5  | Every cross-row invariant is a constraint, a unique index or a foreign key             | list the invariants; find each one in the DDL         | —                             |
| SD6  | Timestamps are zone-aware and stored in UTC                                            | check the column types                                | —                             |
| SD7  | Money is decimal with a stated scale, and the currency is a column                     | check the types                                       | —                             |
| SD8  | Foreign keys exist and are indexed on the child side                                   | query the catalog for unindexed foreign keys          | Delete performance            |
| SD9  | Soft delete, if present, is accounted for in every query, unique index and foreign key | grep for the flag; check the partial indexes          | —                             |
| SD10 | Enumerations are a constraint or a lookup table, not free text                         | check the columns that hold a small set of values     | —                             |

## Why each one

**SD1** is the check that prevents most of the others from being needed. A
table with a fuzzy grain grows columns that apply to some rows and not others,
and every one of those columns is nullable for a reason nobody records.

**SD5** is the one that gets deferred to application code, and deferring it is
how the data ends up violating it. The test is empirical: if the invariant is
not in the schema, write the query that finds the rows breaking it, and run it.

**SD9** is why soft delete deserves a decision rather than a habit. A unique
index on an email column stops being correct the moment a deleted row keeps its
email, and the fix — a partial index — has to be there from the start.
