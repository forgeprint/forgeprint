# Fix and regression test

The fix removes the defect where it is, the test proves it, and the scaffolding
from the investigation does not ship.

| #   | Check                                                                                    | How                                                               | Source                                               |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| F1  | The fix changes the defect named in the analysis, not the place the failure surfaced     | compare the fix's diff with the defect location in the analysis   | WPF ch. 15                                           |
| F2  | The regression test fails on the fix commit's parent                                     | `git checkout <fix>^`, run the test, expect red                   | Agans, rule 9 (If you didn't fix it, it ain't fixed) |
| F3  | The regression test passes on the fix commit                                             | `git checkout <fix>`, run it                                      | Agans, rule 9                                        |
| F4  | The original report's steps pass, not only the reduced case                              | re-run them and say so in the analysis                            | Agans, rule 9; WPF ch. 15                            |
| F5  | The same defect pattern was searched for elsewhere, and the result is recorded           | the grep or query and its hits are in the analysis                | WPF ch. 16                                           |
| F6  | No sleep, retry or widened timeout was added as the fix                                  | grep the fix's diff for them                                      | WPF ch. 15; Agans, rule 9                            |
| F7  | Temporary logging, breakpoints and disabled checks were removed                          | grep the diff for the markers the investigation used              | Agans, rule 5                                        |
| F8  | A race is covered by a test that forces the interleaving and passes without timing slack | read the test: a latch, barrier or controlled scheduler, no sleep | Agans, rule 2 (Make it fail); WPF ch. 4              |

## Why each one

**F2 is the proof.** A regression test that has never been seen failing has
never shown it can detect the bug. Committing the reproduction first
(`reproduce-first.md` R3) makes this check a checkout and a run.

**F1** catches the symptom fix: a guard at the crash site for a value that went
wrong three calls earlier. The crash stops, the wrong value keeps flowing, and
the next failure is further from its cause.

**F6** is the race refusal made mechanical. A sleep or a retry changes the odds
of the bad interleaving, not whether it can happen, and it moves the failure to
a slower machine.
