# Runbook steps

A runbook is read by somebody woken up, under pressure, possibly for the
first time. Every row below is about making the next action obvious and its
success checkable.

| #   | Check                                                                        | How                                                                          | Source                                                         |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| RS1 | There is one runbook per paging alert, at the path the alert links           | follow each `runbook_url`; the file exists                                   | SRE Workbook ch. 8 — on-call                                   |
| RS2 | It opens with what the alert means for users, in one or two sentences        | read the first paragraph                                                     | SRE Book ch. 6; SRE Workbook ch. 8                             |
| RS3 | It lists the first three checks, each with the exact command or console path | read the checks; no "look at the dashboards"                                 | SRE Book ch. 11 — being on-call                                |
| RS4 | Every step has an action, a command, and an expected result                  | each numbered step has all three; a step without "Expect:" is a finding      | SRE Book ch. 11; SRE Workbook ch. 8                            |
| RS5 | The always-safe mitigation is named first: roll back, drain, fail over       | the mitigation section precedes diagnosis                                    | SRE Book ch. 14 — managing incidents                           |
| RS6 | It says when to escalate, and to whom by role                                | an escalation section with a time limit and a role                           | SRE Workbook ch. 9 — incident response                         |
| RS7 | It was exercised recently by somebody who did not write it                   | a "last exercised" date and name-by-role at the top; within the last quarter | SRE Workbook ch. 8 — training                                  |
| RS8 | Commands use placeholders for secrets, never values                          | grep for tokens, passwords, connection strings                               | OWASP ASVS 5.0 — secrets management (docs/review-standards.md) |

## Why each one

**RS4** is the row the others depend on. "Restart the service" is an action;
"run this, expect that within five minutes" is a step somebody can finish and
know they finished. Without the expected result, the responder cannot tell a
fix from a coincidence.

**RS5** because the fastest way back inside the SLO is usually the change
that needs no diagnosis — rolling back the last release, draining the bad
zone. The SRE Book's incident chapter puts restoring service ahead of
understanding it; a runbook that starts with diagnosis gets that backwards.

**RS7** because a runbook nobody has followed since it was written describes
the system as it was. Having someone else run it is the cheapest way to find
the step that no longer works.
