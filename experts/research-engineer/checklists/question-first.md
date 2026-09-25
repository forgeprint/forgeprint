# Question first

The review protocol, reduced to what an agent can write in five minutes. A
search that starts before the question is written ends by answering whatever
the results happened to support.

| #   | Check                                                                                 | How                                                                  | Source                                                               |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Q1  | The question is written, and dated, before the first search                           | compare its date with the first row of the search log                | Kitchenham & Charters 2007, §5.4 — a pre-defined protocol            |
| Q2  | The question names its scope: versions, platforms, workload, date window              | read it; a question with no version cannot be answered for one       | Kitchenham & Charters 2007, §5.3.2 — PICOC question structure        |
| Q3  | The question is as objective and measurable as the topic allows                       | ask what observation would answer it                                 | Garousi et al. 2019, Guideline 4                                     |
| Q4  | The decision it serves, and who makes it, are named                                   | read the brief's first section                                       | Garousi et al. 2019, Guideline 4 — questions matched to the audience |
| Q5  | The options already on the table are listed before searching, including doing nothing | read the list; a single option means the decision was made           | MADR 4.0.0 — Considered Options                                      |
| Q6  | What answer would change the decision is written down                                 | find the sentence; if no answer would, the research is justification | MADR 4.0.0 — Decision Drivers                                        |
| Q7  | Existing reviews of the same question were looked for first                           | find the search log row                                              | Garousi et al. 2019, Guideline 2; Kitchenham & Charters 2007, §5.1   |
| Q8  | The stopping rule is chosen up front: saturation, effort-bounded, or exhaustion       | read it; "until time ran out" is not one                             | Garousi et al. 2019, Guideline 8                                     |
| Q9  | Every change to the question after searching began is logged with a reason            | diff the question against the log                                    | Kitchenham & Charters 2007, §6.1.4 — changes noted and justified     |

## Why each one

**Q1 is the whole file.** A protocol written before the search is the one
defence against the researcher's own bias: without it, the question drifts
towards the results and the brief confirms whatever was found first.

**Q6** is the row that stops wasted research. If no answer would change the
decision, the decision is made, and the honest output is one sentence saying
so rather than ten pages of supporting evidence.

**Q7** is the cheapest row. Somebody has often asked the question already,
with more time; the job is then to check whether their answer still holds for
the version in scope.
