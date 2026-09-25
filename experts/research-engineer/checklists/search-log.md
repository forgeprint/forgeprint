# Search log

A search nobody can repeat is a search nobody can check. The log is written
while the search runs, not reconstructed afterwards from the sources that
survived.

| #   | Check                                                                                         | How                                                              | Source                                                                  |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| L1  | Every search has a row: where, the query or path, the date, hits, kept                        | count the rows against the sources table                         | Kitchenham & Charters 2007, §6.1.4 and Table 2                          |
| L2  | The log was written as the search ran, and changes to it are noted                            | look for rows added out of date order                            | Kitchenham & Charters 2007, §6.1.4                                      |
| L3  | Why each place was searched is stated                                                         | read the log's preamble                                          | Kitchenham & Charters 2007, §6.1.4 — rationale for the sources searched |
| L4  | Primary sources were searched directly: spec, source code, release notes, issue tracker       | find their rows                                                  | Garousi et al. 2019, Guideline 6 — identify the sources early           |
| L5  | Search engines, specialised sites, backlinks and people were all considered                   | read the "where" column                                          | Garousi et al. 2019, Guideline 7                                        |
| L6  | The best source was snowballed — its references backwards, its citations forwards             | find the snowballing rows and the iteration that added nothing   | Wohlin 2014 — backward and forward snowballing from a start set         |
| L7  | Counter-evidence was searched for on purpose, one query per option                            | find "problems", "migrating away", "issue" queries with versions | Kitchenham & Charters 2007, §6.1.2 — publication bias                   |
| L8  | The search stopped by the rule chosen in the question, and the log says which                 | compare the last rows with the stopping rule                     | Garousi et al. 2019, Guideline 8                                        |
| L9  | A `## Not found` section exists, listing each unanswered question and where it was looked for | grep for the heading; empty says "nothing"                       | Kitchenham & Charters 2007, §6.1.4 — the thoroughness of the search     |
| L10 | Raw results were kept, so the selection can be re-done                                        | find them, or the note of where they are                         | Kitchenham & Charters 2007, §6.1.4 — unfiltered results retained        |

## Why each one

**L9 is the row agents skip.** An agent reports what it found and is silent
about what it did not, and the reader cannot tell a gap in the evidence from a
gap in the search. A written "looked in these three places, found nothing"
is a result, and often the most useful one in the brief.

**L7** is the defence against the most common bias in technical research:
successes are written up, failures are quietly migrated away from. Unless the
counter-evidence is searched for by name, it is not found.

**L1 and L2** together are what make the brief repeatable. A reviewer who can
re-run the queries can check the selection; one who cannot has to trust it.
