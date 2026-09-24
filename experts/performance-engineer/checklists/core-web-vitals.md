# Core Web Vitals and web budgets

Field data decides whether a page passes; lab data explains why. Keeping the
two apart is most of the discipline.

| #    | Check                                                                                         | How                                                                               | Source                        |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------- |
| CW1  | The pass/fail judgement uses field data at the 75th percentile, mobile and desktop separately | read where the number came from: real-user monitoring or the public field dataset | web.dev — Core Web Vitals     |
| CW2  | LCP is judged against ≤ 2.5 s good, > 4.0 s poor                                              | read the p75 value                                                                | web.dev — CWV thresholds      |
| CW3  | INP is judged against ≤ 200 ms good, > 500 ms poor                                            | read the p75 value                                                                | web.dev — INP                 |
| CW4  | CLS is judged against ≤ 0.1 good, > 0.25 poor                                                 | read the p75 value                                                                | web.dev — CWV thresholds      |
| CW5  | A lab score is never reported as a Core Web Vitals result                                     | grep the report for a Lighthouse score next to "passes" or "Core Web Vitals"      | web.dev — lab and field       |
| CW6  | Where field and lab disagree, field sets the priority                                         | read the report's ordering of work                                                | web.dev — lab and field       |
| CW7  | Lighthouse is pinned to a version and that version is recorded                                | read the command: `npx lighthouse@<version>`                                      | Lighthouse 13.5.0             |
| CW8  | Lighthouse is run five times per side and read at the median                                  | count `lh-*.json` files in `baseline/` and `after/`                               | Lighthouse variability        |
| CW9  | Lighthouse runs one at a time, on a machine doing nothing else                                | read the environment note; no parallel runs                                       | Lighthouse variability        |
| CW10 | No INP claim rests on a page-load lab run                                                     | find where the INP number came from; a navigation run has no interaction          | web.dev — INP                 |
| CW11 | A performance budget exists, and a regression past it fails the build                         | find the budget file and the CI step; break it on a branch and watch it fail      | web.dev — performance budgets |

## Why each one

**CW5 is the most common false claim in web performance.** A green Lighthouse
score on a fast laptop says nothing about the 75th percentile of real phones on
real networks, and the web.dev guidance is explicit that field data is what to
prioritise when both exist.

**CW8** exists because a single Lighthouse run is noisy enough to invent or hide
an improvement. The Lighthouse team's own variability document puts the median
of five runs at roughly twice the stability of one.

**CW11** is what keeps the work done. Without a failing check, the next feature
spends the improvement, and nobody notices until the field data does — a
month later.
