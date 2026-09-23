# SLO and alerting

Start from the user journey and work backwards. A dashboard built first answers
no question, and an alert that fires without a runbook wakes somebody to read
code at 3am.

| #    | Check                                                                               | How                                              | Source                          |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------- |
| SL1  | The user journey is named before any indicator is chosen                            | read the SLO document; does it start with a user | Google SRE — SLIs               |
| SL2  | The indicator reflects the journey — availability and latency of what the user does | not CPU, not memory, not queue depth             | Google SRE                      |
| SL3  | The objective is a number with a window                                             | "99.9% under 400ms over 28 days", not "fast"     | Google SRE — SLOs               |
| SL4  | An error budget is derived, and there is a stated consequence when it is spent      | read what happens at zero                        | Google SRE — error budgets      |
| SL5  | Pages fire on symptoms, not causes                                                  | read every paging alert; high CPU is a cause     | Google SRE — alerting on SLOs   |
| SL6  | Every page has a runbook naming the first three checks                              | follow one link                                  | —                               |
| SL7  | Fast-burn and slow-burn alerts are distinguished                                    | read the burn rate windows                       | Google SRE — multiwindow alerts |
| SL8  | An alert acknowledged repeatedly without action is deleted or fixed                 | look at the last month's history                 | Alert fatigue                   |
| SL9  | Non-paging signals go somewhere that is not the pager                               | check the routing                                | —                               |
| SL10 | Retention and sampling are decided, not defaulted                                   | read the configuration and what it costs         | Cost review                     |

## Why each one

**SL5 is where most alerting goes wrong**, and it is intuitive to get backwards.
High CPU is interesting; it is not an emergency, and most of the time it is a
cause of nothing at all. Page when users are affected or when the error budget
is burning fast enough to be spent before anyone would otherwise look.

**SL8** is the rule that keeps the rest working. An alert that has fired ten
times and been acknowledged ten times is actively training everybody to ignore
its whole class — including the eleventh firing, which will be the real one.

**SL3** is what makes SL4 possible at all. Without a number and a window there
is no budget, and without a budget the conversation about whether to ship is a
matter of who is most confident.
