# Test design techniques

Cases chosen by intuition cluster where the author was already looking. A named
technique turns the input space into a finite list, so a reviewer can see what
was covered and what was skipped on purpose.

| #   | Check                                                                                     | How                                                                                  | Source                                              |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| TT1 | Every input with classes of values has its valid and invalid partitions listed            | the partitions appear in the test list or in the test names                          | ISTQB CTFL v4.0.1 §4.2.1; ISO/IEC/IEEE 29119-4:2021 |
| TT2 | Each partition, including each invalid one, is exercised by at least one test             | map tests to partitions; an unmapped partition is a gap                              | ISTQB CTFL v4.0.1 §4.2.1                            |
| TT3 | Each ordered range is tested just below, on and just above every boundary                 | three-value boundary analysis; count the cases per boundary                          | ISTQB CTFL v4.0.1 §4.2.2; ISO/IEC/IEEE 29119-4:2021 |
| TT4 | Logic that combines conditions has a decision table, with infeasible columns written down | the table is in the test file or the test list; one test per feasible column         | ISTQB CTFL v4.0.1 §4.2.3; ISO/IEC/IEEE 29119-4:2021 |
| TT5 | An object with a lifecycle covers every valid transition and invalid events per state     | draw the states from the code; compare with the tests                                | ISTQB CTFL v4.0.1 §4.2.4; ISO/IEC/IEEE 29119-4:2021 |
| TT6 | Branch coverage of the changed unit was read after the cases were derived                 | run the coverage tool with branch reporting; each uncovered branch is explained      | ISTQB CTFL v4.0.1 §4.3.2                            |
| TT7 | Each test traces to the coverage item it exercises                                        | the test name or a comment over the table-driven group names the partition or column | ISO/IEC/IEEE 29119-4:2021; ISTQB CTFL v4.0.1 §1.4.4 |
| TT8 | Cases added from experience are labelled as error guessing, not passed off as derived     | look for a separate group or a comment                                               | ISTQB CTFL v4.0.1 §4.4.1                            |

## Why each one

**TT3 finds the defect that ships most often.** Off-by-one errors sit exactly on
a boundary, and a test at the middle of a range passes whether the comparison
is `<` or `<=`. Three values per boundary is the cheapest way to make that
difference visible, and it is also what a mutation tool will try first.

**TT6 is a check on the derivation, not a goal.** Reading branch coverage after
deriving cases turns every uncovered branch into a question — which partition
did the analysis miss? — instead of a number to push upwards.

**TT2** is where the invalid half disappears. Tests for invalid partitions are
the ones that get dropped under time pressure, and they are the ones that
exercise the validation code a caller will eventually hit.
