# Traceable claims

A claim nobody can trace is a claim nobody can check, and a number nobody
fetched is the one that is wrong. This checklist is about whether every
sentence in the brief could be followed back to where it came from.

| #   | Check                                                                                       | How                                                                    | Source                                                                  |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| C1  | Every factual sentence carries a source id, or is labelled as inference                     | grep sentences in the answer and options sections for `[S`             | Garousi et al. 2019, Guideline 12 — traceability links                  |
| C2  | Every number was fetched from where it originates, and its row says how and when            | open the row: a URL or command and a read date                         | Kitchenham & Charters 2007, Table 2 — URL and date searched             |
| C3  | A number seen only in a summary is under `## Not verified` and not used in the answer       | grep the heading; compare its numbers with the answer                  | Kitchenham & Charters 2007, §6.3.1 — prefer the primary study           |
| C4  | Every number carries its unit and conditions: version, hardware, sample, percentile         | read each number with the sentence around it                           | Kitchenham & Charters 2007, §6.5.1 — tabulate context with outcomes     |
| C5  | Derived numbers are recomputed from fetched inputs, and the arithmetic is shown             | redo one                                                               | Garousi et al. 2019, Guideline 12 — extract enough data to address it   |
| C6  | Where sources disagree, both are reported with their grades                                 | find each disagreement in the disagreements section                    | Kitchenham & Charters 2007, §6.5.1 — consistent or inconsistent results |
| C7  | Each disagreement carries its likeliest reason: version, workload, method, date or interest | read it; "unknown" is allowed, silence is not                          | Kitchenham & Charters 2007, §6.5.1 — sources of heterogeneity           |
| C8  | Each conclusion carries a certainty: high, moderate, low or very low                        | read the answer paragraph                                              | GRADE Handbook, §5 — quality of evidence                                |
| C9  | The reason a certainty is not higher is stated                                              | look for the downgrade: bias, inconsistency, indirectness, imprecision | GRADE Handbook, §5.2 — factors that decrease quality                    |
| C10 | Evidence about a different version or workload than the question's is marked indirect       | compare each source's version with the question's scope                | GRADE Handbook, §5.2.3 — indirectness                                   |

## Why each one

**C2 and C3 are one rule.** Every retelling of a number drops a condition — the
percentile, the hardware, the version, the sample — until what is left
compares nothing. Fetching it from the origin costs one request; not fetching
it costs the decision.

**C6 and C7** are what separate research from advocacy. The temptation is to
cite the source that agrees with the draft and leave the other one out; the
reader then decides without the evidence against the answer, which is the
evidence they needed most.

**C9** makes the certainty mean something. "Low" with no reason is a mood;
"low, because both benchmarks are vendor-run on a version out of scope" is a
finding the reader can act on.
