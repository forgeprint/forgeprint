# Mutation analysis

Line coverage records that code ran under a test. A mutant records whether any
test would have failed had that code been different. The second is the question
a test suite exists to answer.

| #   | Check                                                                                   | How                                                                                         | Source                                     |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| MA1 | A mutation tool was run on the files the change touched                                 | StrykerJS `mutate` limited to the changed files, or the equivalent target setting elsewhere | StrykerJS configuration; PIT documentation |
| MA2 | The score is reported as detected over valid, with the counts behind it                 | detected = killed + timeout; valid = detected + survived + no coverage                      | Stryker, _Mutant states and metrics_       |
| MA3 | Every survived or no-coverage mutant in the changed lines has a written outcome         | the triage lists each one: killed by a new test, equivalent, or accepted                    | Stryker, _Mutant states and metrics_       |
| MA4 | A mutant marked equivalent carries the reason no input can tell it apart                | read the reasons; "hard to test" is not equivalence                                         | Stryker, _Equivalent mutants_              |
| MA5 | Compile and runtime errors are left out of the score, not counted as kills              | the report's invalid count is separate from detected                                        | Stryker, _Mutant states and metrics_       |
| MA6 | A survivor is killed by a test of behaviour, not by asserting on the mutated expression | read the new test; it states an outcome a caller would see                                  | Vocke; Fowler, _Mocks Aren't Stubs_        |
| MA7 | The tool, its version and its configuration are recorded, so the run can be repeated    | the configuration file is committed, or the report header names both                        | StrykerJS configuration; PIT documentation |

## Why each one

**MA3 is where the value is.** A score is a summary; each survivor is a
specific line whose change no test would catch. Triaging them one by one is
what turns the run into new tests or into a recorded, reasoned decision.

**MA4** guards the escape hatch. Some mutants really are equivalent — Stryker's
own documentation shows operators that cannot change the result for the values
the code can reach — and there is no automatic way to find them. That makes
"equivalent" the easiest label to misuse, so it needs an argument, not a word.

**MA1** keeps the cost proportional. Mutating the whole codebase on every change
is slow enough that it stops being done; mutating the changed files is fast
enough to be part of finishing the change.
