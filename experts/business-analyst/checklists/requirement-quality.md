# Requirement quality

One statement, one requirement, and nothing in it a tester would have to
interpret. Most rows are a grep.

| #   | Check                                                                                                       | How                                                                                     | Source                                                                |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| RQ1 | Every requirement is classified: business, stakeholder, solution (functional or non-functional), transition | the class column is filled; transition requirements exist if anything is being replaced | BABOK v3, 2.3 Requirements Classification Schema                      |
| RQ2 | Every requirement has a unique ID that is never reused                                                      | sort the ID column; no duplicates, no reuse after deletion                              | ISO/IEC/IEEE 29148:2018                                               |
| RQ3 | No vague terms                                                                                              | grep for "fast", "easy", "user-friendly", "flexible", "robust", "etc.", "adequate"      | INCOSE Guide to Writing Requirements v4, R7                           |
| RQ4 | No escape clauses                                                                                           | grep for "where possible", "if practical", "as appropriate", "as required"              | INCOSE GtWR v4, R8                                                    |
| RQ5 | No open-ended clauses                                                                                       | grep for "including but not limited to", "and so on"                                    | INCOSE GtWR v4, R9                                                    |
| RQ6 | One requirement per statement — no combinators joining two                                                  | grep for " and ", " or ", "and/or" and read each hit                                    | INCOSE GtWR v4, R19; characteristic C5 Singular                       |
| RQ7 | Active voice, with the actor named                                                                          | read each row: who or what does it                                                      | INCOSE GtWR v4, R2                                                    |
| RQ8 | No pronoun refers to another statement                                                                      | grep for "it", "this", "they" at the start of a clause                                  | INCOSE GtWR v4, R24                                                   |
| RQ9 | Each requirement can be verified, and the method is named: test, demonstration, inspection or analysis      | the verification column is filled                                                       | INCOSE GtWR v4, characteristic C7 Verifiable; ISO/IEC/IEEE 29148:2018 |

## Why each one

**RQ6 is the row that breaks traceability quietly.** A requirement that is two
requirements can half-pass; the test result then cannot say which half, and
the trace matrix reports it as done.

**RQ3 to RQ5** are cheap because they are greps, and they catch the wording
that lets everybody declare success: nobody can fail "fast where possible".

**RQ1** finds the missing class. A specification with no transition
requirements for a system that replaces another has not planned the
migration, the training or the period when both run.
