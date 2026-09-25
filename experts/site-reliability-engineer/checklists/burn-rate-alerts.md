# Burn-rate alerts

A page should mean one thing: the error budget is being spent fast enough
that a human needs to act now. Burn rate is how fast, relative to spending
exactly the whole budget over the window; 1 means on track to spend all of it.

| #   | Check                                                                                    | How                                                                                 | Source                                            |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| BR1 | Every paging alert is derived from an SLO's burn rate                                    | each page's expression references the SLO's good/total ratio                        | SRE Workbook ch. 5 — alerting on SLOs             |
| BR2 | Each burn-rate alert uses a long and a short window, both over threshold                 | `and` of the two windows in the rule                                                | SRE Workbook ch. 5 — multiwindow, multi-burn-rate |
| BR3 | Fast burn pages: 14.4 over 1h and 5m, 6 over 6h and 30m (for a 30-day window)            | read the thresholds and windows; scaled if the SLO window differs                   | SRE Workbook ch. 5, table 5-8                     |
| BR4 | Slow burn opens a ticket, not a page: 1 over 3d and 6h                                   | the routing sends it to the ticket queue                                            | SRE Workbook ch. 5, table 5-8                     |
| BR5 | No page fires on CPU, memory, disk or queue depth unless the SLO file names it a symptom | `grep -n -i -E "cpu\|memory\|disk"` over the paging rules                           | SRE Book ch. 6 — symptoms versus causes           |
| BR6 | Every paging alert links a runbook                                                       | a `runbook_url` (or equivalent) annotation on each rule, and the file exists        | SRE Book ch. 6; SRE Workbook ch. 8 — on-call      |
| BR7 | A low-traffic service handles the small-denominator problem explicitly                   | a minimum request count in the rule, synthetic traffic, or a longer window, written | SRE Workbook ch. 5 — low-traffic services         |
| BR8 | Pages that fired and needed no action in the last month are reviewed                     | the on-call handoff lists each one and its disposition                              | SRE Workbook ch. 8 — on-call                      |

## Why each one

**BR2** is the difference between an alert that is precise and one that
resets. A 1-hour window alone keeps firing for most of an hour after the burn
stopped; adding the 5-minute window means the alert clears as soon as the
fast burn does, without losing the long window's resistance to blips.

**BR5** is the rule most alerting breaks. High CPU is a cause, and most of the
time a cause of nothing the user sees. The SRE Book's framing is that pages
are for symptoms; causes belong on dashboards the responder opens after the
page.

**BR7** because at ten requests an hour one failure is a 10% error rate, and
a burn-rate alert pages on it. The Workbook lists the options; the check is
that one was chosen and written down, not that the service is left to page
at random.
