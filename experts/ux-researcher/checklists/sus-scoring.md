# SUS scoring

The System Usability Scale is useful because it is standard. Every change to
how it is given or scored removes the benchmark it is compared with.

| #   | Check                                                          | How                                  | Source                                                       |
| --- | -------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| SU1 | All ten items are used, unaltered, on the five-point scale     | compare the form with Brooke's items | Brooke, _SUS: A "quick and dirty" usability scale_, 1996     |
| SU2 | SUS is given after the tasks and before any debrief discussion | the session script's order           | Brooke 1996                                                  |
| SU3 | Odd items are scored response − 1; even items 5 − response     | recompute from the raw responses     | Brooke 1996; Sauro, _Measuring Usability with the SUS_, 2011 |
| SU4 | The sum is multiplied by 2.5 to give 0–100                     | recompute                            | Brooke 1996                                                  |
| SU5 | The score is not described as a percentage                     | grep the report for "SUS" near "%"   | Sauro 2011                                                   |
| SU6 | The comparison point is the average of 68, with its source     | read the interpretation              | Sauro 2011                                                   |
| SU7 | The mean is reported with n and a confidence interval          | read the results table               | Budiu and Moran, NN/g 2021                                   |
| SU8 | Raw per-item responses are kept so the score can be recomputed | the scoring sheet exists             | Brooke 1996                                                  |

## Why each one

**SU3 and SU4 are where scores go wrong silently.** Reversing the even items
the wrong way produces a plausible number between 0 and 100 that means
nothing; recomputing from raw responses is the only check.

**SU5** matters because a 70 reads as "70% usable" to anybody who has not seen
the scale; Sauro's data puts it near the middle of the distribution.

**SU1** protects the benchmark. A reworded or shortened SUS is a different
questionnaire, and 68 no longer applies to it.
