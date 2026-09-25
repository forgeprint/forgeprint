# Decommission

The old path is removed on evidence, with everything that only existed for it.

| #   | Check                                                                                                        | How                                                                                | Source                                                             |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| DC1 | Traffic to the old path is measured as zero for a period stated in the plan                                  | read the metric or log query and its window                                        | Fowler, Strangler Fig Application (2024-08-22)                     |
| DC2 | Nothing still reads the old path's data; the data is migrated or archived under a stated retention           | search for readers (queries, jobs, reports); read the archive decision             | Fowler, Strangler Fig Application (2024-08-22)                     |
| DC3 | Everything that existed only for the old path is listed: jobs, credentials, DNS names, firewall rules, flags | read the decommission checklist in the plan                                        | The Twelve-Factor App — IV. Backing services; XII. Admin processes |
| DC4 | Credentials used only by the old path are revoked, not just unused                                           | the plan names each credential and its revocation step                             | OWASP ASVS 5.0.0, 13.3.1 (via `docs/review-standards.md`)          |
| DC5 | Transitional code built for the migration is removed in the same or the next pull request                    | grep for the transitional components the plan lists                                | Cartwright, Horn, Lewis (2024) — Transitional Architecture         |
| DC6 | The decommission is its own pull request, and it deletes code                                                | the diff is mostly deletions                                                       | Fowler, Branch By Abstraction (2014-01-07) — final step            |
| DC7 | Feature flags and abstraction layers that only served the switch are removed                                 | grep for the flag names; the abstraction has one implementation left or is inlined | Fowler, Branch By Abstraction (2014-01-07)                         |

## Why each one

**DC1** because "nobody uses it" is a belief until a metric says so. The window
matters: a monthly report or a yearly job is invisible in a week of traffic.

**DC4** is the security half of decommissioning. A credential nobody uses but
nobody revoked is an unmonitored way in.

**DC5** closes the loop the migration opened. The strangler fig pattern accepts
transitional code as the price of safety; leaving it after the migration is
paying the price and keeping the risk.
