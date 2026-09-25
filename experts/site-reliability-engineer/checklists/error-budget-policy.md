# Error budget policy

The error budget is only a control if its consequences are agreed before it
runs out. The policy is the document that makes spending it a decision rather
than a surprise.

| #   | Check                                                                         | How                                                                       | Source                                        |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| EB1 | A written policy exists beside the SLOs                                       | `slo/error-budget-policy.md` exists                                       | SRE Workbook, appendix B                      |
| EB2 | It is signed off by whoever decides releases, not only by the team on call    | named approvers in the file                                               | SRE Workbook, appendix B; ch. 2               |
| EB3 | It says what changes when the budget is exhausted for the window              | a stated release freeze or equivalent, with the exceptions (security, P0) | SRE Workbook, appendix B                      |
| EB4 | It says what happens at an intermediate threshold                             | an action at a stated percentage consumed, before zero                    | SRE Workbook ch. 2 — decision making          |
| EB5 | A single incident above a stated share of the budget always gets a postmortem | the threshold is written (appendix B uses 20% over four weeks)            | SRE Workbook, appendix B                      |
| EB6 | It says who resolves a disagreement about the calculation or the action       | a named escalation role                                                   | SRE Workbook, appendix B                      |
| EB7 | Budget consumption is visible to the people the policy binds                  | a report or dashboard linked from the policy, updated at least weekly     | SRE Workbook ch. 2 — continuous improvement   |
| EB8 | The policy has been applied at least once, or tested in a review              | the last time the freeze or threshold triggered, and what was done        | SRE Book ch. 3 — motivation for error budgets |

## Why each one

**EB3** is the whole reason to have a budget. Without a consequence at zero,
the SLO is a report, and the conversation about whether to ship during a bad
month is decided by whoever argues hardest.

**EB2** because a freeze signed only by the on-call team is a freeze the
product side has never agreed to, and it will be overruled the first time
it matters.

**EB5** because a slow, steady burn and one large outage can spend the same
budget, and only the second one reliably gets looked at. A threshold makes
the large single incident a postmortem by rule rather than by mood.
