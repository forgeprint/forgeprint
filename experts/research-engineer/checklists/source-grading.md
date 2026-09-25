# Source grading

Sources are not equal, and a brief that cites them as if they were hands the
reader the job of grading them. One row per source, graded on the same
columns every time.

| #   | Check                                                                                        | How                                                                  | Source                                                                   |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| G1  | Every source has one row in the sources table, with an id the brief cites                    | count the ids used against the rows                                  | Garousi et al. 2019, Guideline 12 — traceability links                   |
| G2  | Each is marked primary or secondary                                                          | read the "kind" column                                               | Kitchenham & Charters 2007, §6.3.1 — hierarchy of evidence               |
| G3  | A secondary source is not cited where its primary is reachable                               | for each secondary row, look for the primary                         | Kitchenham & Charters 2007, §6.3.1                                       |
| G4  | Each is marked independent, vendor or vested                                                 | read the "independence" column; ask who benefits from the conclusion | Garousi et al. 2019, Table 7 — objectivity, vested interest              |
| G5  | Vendor documentation is used for what the product claims, not for how well it does it        | read every vendor-cited sentence                                     | Garousi et al. 2019, Table 7 — objectivity                               |
| G6  | Each carries an outlet tier: 1 high control, 2 moderate, 3 low                               | read the "tier" column                                               | Garousi et al. 2019, Table 7 — outlet type                               |
| G7  | The producer's authority is stated: who wrote it, and what else they have published on it    | read the row                                                         | Garousi et al. 2019, Table 7 — authority of the producer                 |
| G8  | Each carries the version it describes, the date published and the date read                  | grep the table for empty cells                                       | Garousi et al. 2019, Table 7 — date; Kitchenham & Charters 2007, Table 2 |
| G9  | An undated source is graded as if it were old                                                | read its grade                                                       | Garousi et al. 2019, Table 7 — date                                      |
| G10 | A source's method is noted where it has one: sample, hardware, workload, how it was measured | read the row for any source that reports a number                    | Garousi et al. 2019, Table 7 — methodology                               |

## Why each one

**G5 is the row that changes answers.** Vendor documentation is the best
source there is for what a product is meant to do, and a poor one for whether
it does it well. Mixing the two roles is how a marketing page becomes a
benchmark in somebody's ADR.

**G4** is the question the reader cannot ask without help: a comparison written
by one of the compared projects, or a benchmark run by the vendor it favours,
looks exactly like an independent one once it is a footnote.

**G8** decides whether anything else in the row matters. A source describing
a version two majors back is evidence about software nobody in scope is
running.
