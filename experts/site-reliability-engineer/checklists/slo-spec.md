# SLO specification

An SLO is only real if somebody else can compute it from the same data and
get the same answer. Each row is something the SLO file has to contain for
that to be true.

| #   | Check                                                                           | How                                                                     | Source                                             |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| SS1 | Every SLO is a file in the repository, not a slide or a wiki sentence           | `ls slo/*.yaml` lists one per objective                                 | OpenSLO `openslo/v1`                               |
| SS2 | The file validates against the specification                                    | `oslo validate -f slo/*.yaml` exits 0, in CI                            | oslo 0.13.0                                        |
| SS3 | The indicator is a ratio: a good-events query over a total (valid) events query | `spec.indicator.spec.ratioMetric` has both `good` and `total`           | OpenSLO `openslo/v1` — SLI; SRE Workbook ch. 2     |
| SS4 | The indicator is measured as close to the user as the data allows               | the query reads load balancer or client data, not host metrics          | SRE Book ch. 4 — indicators; SRE Workbook ch. 2    |
| SS5 | The time window is stated, with rolling or calendar made explicit               | `spec.timeWindow[].duration` and `isRolling`                            | OpenSLO `openslo/v1` — SLO; SRE Workbook ch. 2     |
| SS6 | The target is a number below 1, with the budget it implies written next to it   | `objectives[].target`; a comment with the budget in minutes or requests | SRE Book ch. 3 — embracing risk; ch. 4             |
| SS7 | The target is no higher than any synchronous dependency's                       | list the dependencies and their SLOs; compare                           | SRE Book ch. 3 — embracing risk                    |
| SS8 | The budgeting method is chosen on purpose (occurrences or time slices)          | `spec.budgetingMethod`; the reason in the file's description            | OpenSLO `openslo/v1` — SLO                         |
| SS9 | Each SLO names the user journey it protects and who agreed to it                | `metadata` or `description` names the journey and the stakeholder       | SRE Workbook ch. 2 — getting stakeholder agreement |

## Why each one

**SS3** is the row that turns an adjective into a number. "Available" means
nothing until it is "requests to `/checkout` that did not return a 5xx,
divided by all requests to `/checkout`". With both queries in the file, two
people get the same answer; with one sentence, they get an argument.

**SS6** because the budget is the useful half of the SLO. 99.9% over 28 days
is about 40 minutes; 99.99% is about 4. Writing the minutes next to the
target is what makes a team realise which one it has actually signed up for.

**SS7** because an SLO above a synchronous dependency's is a promise
somebody else controls. The SRE Book's point about risk is that each extra
nine is paid for, and it cannot be paid for by the caller alone.
