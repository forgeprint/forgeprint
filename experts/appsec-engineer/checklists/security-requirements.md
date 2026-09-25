# Security requirements

A requirement is an ASVS control applied to one feature, written so a test can
pass or fail against it.

| #   | Check                                                                                                  | How                                                           | Source                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| SR1 | The target ASVS level (L1, L2 or L3) is stated once, with the reason                                   | read the top of `security/requirements.md`                    | OWASP ASVS 5.0.0 — verification levels                        |
| SR2 | Each feature lists the ASVS requirement IDs that apply to it                                           | a section per feature with IDs such as `8.2.2`                | OWASP ASVS 5.0.0                                              |
| SR3 | Chapters that do not apply are listed as not applicable, with a reason                                 | e.g. V17 WebRTC for a service with no WebRTC                  | OWASP ASVS 5.0.0 — tailoring guidance                         |
| SR4 | Each requirement is written as an observable outcome, not as a property                                | read each: does it name a request, an actor and a result?     | OWASP Threat Modeling Cheat Sheet — testable requirements     |
| SR5 | Object-level authorization is a requirement for every endpoint that takes an object identifier         | find `8.2.2` against each such endpoint                       | OWASP ASVS 5.0.0, 8.2.2; OWASP API Security Top 10 2023, API1 |
| SR6 | Every `mitigate` threat maps to at least one requirement, and every requirement to a threat or a level | cross-reference both files; no orphans in either direction    | OWASP ASVS 5.0.0; Threat Modeling Manifesto                   |
| SR7 | Abuse cases exist where the model found an attacker goal                                               | an "Abuse cases" subsection per feature with an attacker goal | OWASP Threat Modeling Cheat Sheet                             |
| SR8 | Requirements are in the backlog with the feature, not in a separate security backlog                   | the feature's acceptance criteria include the IDs             | NIST SSDF SP 800-218 v1.1, PW.1                               |

## Why each one

**SR4** is the row that turns a policy into work. "Authorization is enforced"
cannot fail; "a user of tenant A requesting tenant B's invoice gets 404" can,
and it tells the test author exactly what to write.

**SR5** is singled out because broken object-level authorization is the most
common API weakness, it is invisible to scanners, and ASVS 5.0 names it
explicitly in 8.2.2.

**SR8** is where requirements usually die. A separate security backlog is
prioritised after every feature; acceptance criteria ship with the feature.
