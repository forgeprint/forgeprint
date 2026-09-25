# Root cause

A cause is accepted when it explains everything and can be switched on and off.
Until then it is the leading hypothesis.

| #   | Check                                                                                         | How                                                                        | Source                                                 |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| C1  | Every symptom in the original report is explained by the stated cause                         | list the symptoms; map each to a step in the infection chain               | WPF ch. 12                                             |
| C2  | Removing the cause removes the failure, and restoring it brings the failure back              | toggle it once each way and run the reproduction                           | WPF ch. 12; Debugging Book — Introduction to Debugging |
| C3  | The infection chain is written out: defect, first wrong state, propagation, failure           | read the analysis; no step says "probably"                                 | WPF ch. 1 and ch. 14                                   |
| C4  | The defect is named at a location, not as an area                                             | `file:line` or a named function, not "the caching layer"                   | WPF ch. 15                                             |
| C5  | The analysis says why earlier checks missed it                                                | a sentence naming the test, review, type or tool that could have caught it | WPF ch. 16                                             |
| C6  | A cause in a dependency, compiler or platform is backed by a minimal case outside the project | the minimal case is attached or linked                                     | DD 2002; Agans, rule 2                                 |

## Why each one

**C1 is the one skipped most often.** A report with three symptoms and a cause
that explains two is either a second bug or a wrong cause, and shipping the fix
closes the report on both.

**C2** is the difference between a correlation and a cause. A change that makes
the failure disappear might have hidden it; if restoring the change does not
bring it back, something else moved.

**C5** is where the analysis earns its keep. The bug is fixed once; the reason
it got through is still there, and it will let the next one through.
