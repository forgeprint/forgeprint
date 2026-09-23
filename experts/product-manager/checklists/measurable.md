# Measurable

A success metric that can only go up is not a metric, it is a slogan. This
checklist is about whether the measurement could ever say no.

| #   | Check                                                                               | How                                                                      | Source                                          |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| M1  | The metric is a named number with a current value and a target                      | read it; "increase engagement" fails                                     | —                                               |
| M2  | It can go down for a bad reason                                                     | ask what would make it fall; if nothing, it is a vanity metric           | Vanity metrics                                  |
| M3  | A counter-metric is named — what this could plausibly damage                        | read it; its absence means nobody looked                                 | Google HEART; guardrail metrics                 |
| M4  | The result that would make you revert is written **before** shipping                | find the sentence                                                        | —                                               |
| M5  | The date you will look is stated                                                    | read it; a metric with no date is one nobody checks                      | —                                               |
| M6  | The metric is not total registered users, page views, story points or lines shipped | grep                                                                     | Vanity metrics — none can fall for a bad reason |
| M7  | It measures the user's outcome, not the team's output                               | ask whose behaviour it describes                                         | Outcomes over outputs                           |
| M8  | It can be measured with what exists, or the instrumentation is part of the work     | ask how it will be read                                                  | —                                               |
| M9  | A leading and a lagging indicator are distinguished                                 | read them; a lagging one alone means waiting a quarter to learn anything | —                                               |

## Why each one

**M4 is the whole file in one row.** Writing the revert condition before
shipping is what separates a measurement from a justification assembled
afterwards, and it takes one sentence. Everybody agrees with it and almost
nobody does it.

**M3** is where the real damage hides. Faster onboarding and a support queue.
More notifications and retention. A change with no counter-metric has a cost
somebody will find later and nobody is looking for now.

**M6** names the comfortable metrics explicitly, because they are chosen for
exactly the reason they are useless: none of them can fall for a bad reason, so
reporting them is always pleasant.
