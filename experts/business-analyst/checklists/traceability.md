# Traceability

A trace that only runs one way finds missing tests but not unrequested scope.
Both directions, and a change assessed against the trace before it is sized.

| #   | Check                                                                                                  | How                                                                    | Source                                         |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------- |
| TR1 | A trace matrix links business → stakeholder → solution requirements → acceptance examples              | open the matrix; each link is an ID pair                               | BABOK v3, task 5.1 Trace Requirements          |
| TR2 | Forward: every business requirement reaches at least one solution requirement                          | count business rows with no child                                      | BABOK v3, task 5.1; ISO/IEC/IEEE 29148:2018    |
| TR3 | Forward: every solution requirement reaches at least one acceptance example or verification            | count solution rows with no test                                       | ISO/IEC/IEEE 29148:2018                        |
| TR4 | Backward: every solution requirement reaches a business requirement                                    | count solution rows with no parent; each is unrequested scope or a gap | BABOK v3, task 5.1 Trace Requirements          |
| TR5 | A requested change lists every requirement, example and process step it touches before it is estimated | the change record has an impact list with IDs                          | BABOK v3, task 5.4 Assess Requirements Changes |
| TR6 | A changed requirement keeps its ID and records the change, not a new row that silently replaces it     | the history of the row                                                 | BABOK v3, task 5.2 Maintain Requirements       |
| TR7 | Approval of the specification is recorded: who, when, which version                                    | the approval record                                                    | BABOK v3, task 5.5 Approve Requirements        |

## Why each one

**TR4 is the direction nobody runs.** A solution requirement that traces to no
business requirement is scope somebody added; it costs the same to build as a
real one and nobody will miss it if it is removed.

**TR5** is the reason to keep the matrix at all. An estimate made before the
impact is traced covers the part the estimator remembered; the trace lists the
rest.

**TR6** protects the trace itself: a requirement deleted and re-added under a
new ID breaks every link that pointed at it.
