# Red, green, refactor

A test that nobody saw fail has not shown it can detect anything. The cycle is
the evidence: red proves the test can see the gap, green proves the code closes
it, refactor keeps the design from paying for both.

| #   | Check                                                                     | How                                                                                      | Source                                     |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| RG1 | A test list exists before the first test is written                       | read the notes or the pending tests; items are behaviours, not code steps                | Canon TDD, step 1                          |
| RG2 | Each new test was run and seen failing before its production code existed | the recorded failing output, one per item                                                | Beck, _TDD: By Example_; Canon TDD, step 2 |
| RG3 | The failure was for the expected reason                                   | the failure line is an assertion about the missing behaviour, not a build or setup error | Canon TDD, step 2                          |
| RG4 | Only one test was red at a time                                           | the log of runs shows one new failure per cycle, never a batch                           | Canon TDD, step 2                          |
| RG5 | The green step added only what the test asked for                         | branch coverage of the new code; a branch no test reaches was added ahead of a test      | Beck, _TDD: By Example_; Canon TDD, step 3 |
| RG6 | No assertion was removed or loosened to reach green                       | `git diff` of the test files over the change; look for deleted or widened assertions     | Canon TDD, step 3                          |
| RG7 | Expected values come from the specification or a hand calculation         | for three expected values, find where each came from; none is pasted program output      | Canon TDD, step 3                          |
| RG8 | Refactoring happened only on green, with a test run after each step       | the run log between the green step and the next red                                      | Beck, _TDD: By Example_; Canon TDD, step 4 |
| RG9 | A test lands in the same commit as the code it drove, or an earlier one   | `git log --stat` over the change                                                         | Beck, _TDD: By Example_                    |

## Why each one

**RG2 and RG3 are the whole method.** A test written after the code passes on
its first run and has never demonstrated it can fail; a test that failed on a
missing import has demonstrated nothing about the behaviour. Both look like
tests in the diff, which is why the recorded failure line is required evidence.

**RG7** catches the quietest defect a test can carry. Copying what the code
returned into the expected value turns the test into a snapshot of today's
behaviour, including today's bug — and it will defend that bug from then on.

**RG6** is the one to grep for in review. An assertion that became
`toBeTruthy()`, or a range that widened, in the same diff as the code change
means the specification moved to meet the code.
