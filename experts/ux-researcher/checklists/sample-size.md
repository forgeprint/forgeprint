# Sample size

A number of participants is a claim about what the study can show. Each
number here comes with its source and with what it does not support.

| #   | Check                                                                                         | How                                                  | Source                                                                                 |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| SS1 | A formative, qualitative test of one user group plans about five participants per round       | read the plan                                        | Nielsen, _Why You Only Need to Test with 5 Users_, NN/g 2000                           |
| SS2 | The plan states that the 85% figure rests on an average discovery rate of 31% across projects | the limits sentence is present                       | Nielsen, NN/g 2000 (Nielsen and Landauer's model)                                      |
| SS3 | With several distinct user groups, three to four participants per group are planned           | count per group                                      | Nielsen, NN/g 2000                                                                     |
| SS4 | A quantitative study plans about 40 participants, or states the wider margin it accepts       | read the plan's margin of error and confidence level | Budiu and Moran, _How Many Participants for Quantitative Usability Studies_, NN/g 2021 |
| SS5 | Quantitative results are reported with a confidence interval and n                            | read the results table                               | Budiu and Moran, NN/g 2021                                                             |
| SS6 | A formative study reports counts ("3 of 5"), never percentages                                | grep the report for "%"                              | Nielsen, NN/g 2000 (qualitative insight, not statistics)                               |
| SS7 | Formative testing is planned as iterations, not as one large round                            | the plan has a second round after fixes              | Nielsen, NN/g 2000                                                                     |

## Why each one

**SS2 is the limit most often dropped.** "Five users find 85% of problems" is
quoted as a law; it is the output of a model using an average rate, and a
product whose problems are harder to hit finds fewer.

**SS6** stops five sessions from being reported as statistics. "60% failed"
from five people is three people, and the report should say three.

**SS4** gives the quantitative number its assumptions — a binary metric, 15%
margin, 95% confidence — so a smaller study can say which one it relaxed.
