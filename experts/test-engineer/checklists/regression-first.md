# Regression first

A fix without a test that reproduced the bug is a claim. The reproducing test
turns it into evidence, and then stays in the suite so the same defect cannot
come back without somebody noticing.

| #   | Check                                                                                  | How                                                                                   | Source                                                                   |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| RF1 | The bug was reproduced as an automated test before the fix was written                 | the recorded failing run predates the fix in the notes or the history                 | ISTQB CTFL v4.0.1 §2.2.3 (confirmation testing)                          |
| RF2 | The reproducing test fails with a message that describes the defect                    | read the failure line; it names the wrong value or the missing behaviour              | Canon TDD, step 2                                                        |
| RF3 | The test sits at the lowest level that can show the defect                             | if a broad test found it, a unit or narrow integration test now fails without the fix | Vocke, _The Practical Test Pyramid_                                      |
| RF4 | The test fails on the parent commit, with only the test applied                        | a separate working copy of the parent (`git worktree add`); run the one test          | ISTQB CTFL v4.0.1 §2.2.3 (confirmation testing)                          |
| RF5 | The whole suite passes after the fix                                                   | run it; a new failure elsewhere is a regression the fix introduced                    | ISTQB CTFL v4.0.1 §2.2.3 (regression testing); ISO/IEC/IEEE 29119-1:2022 |
| RF6 | The test is named after the behaviour; the defect reference is in the commit message   | read the test name and the commit                                                     | ISTQB CTFL v4.0.1 §1.4.4 (traceability)                                  |
| RF7 | Places with the same defect pattern were searched, and each hit has a test or a reason | grep for the construct that caused the bug                                            | ISTQB CTFL v4.0.1 §4.4.1 (error guessing)                                |

## Why each one

**RF4 is the proof, and the one people skip.** A test written after the fix
has only ever run against fixed code. Running it on the parent commit is the
single command that shows it detects the defect rather than merely coexisting
with the fix.

**RF3** matters because a defect found by a slow, broad test is expensive to
diagnose the next time. Pushing the reproduction down to the unit that holds
the mistake gives a failure that names the cause.

**RF7** turns one bug into a class of bugs. The construct that failed here — an
unguarded division, a boundary compared with the wrong operator — usually
appears elsewhere, and the search costs one grep.
