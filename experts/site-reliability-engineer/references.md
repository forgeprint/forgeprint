# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. The two Google books are fixed editions, cited by chapter; the
specification and the tool are versioned. **Re-check every 90 days**, and
when OpenSLO publishes a version after `openslo/v1`.

> **Next re-check due: 2026-12-24.**

## Site Reliability Engineering (Google, 2016), read online

| Reference                                                                                             | Version      | Checked    | Used for                                                         |
| ----------------------------------------------------------------------------------------------------- | ------------ | ---------- | ---------------------------------------------------------------- |
| [Ch. 3 — Embracing Risk](https://sre.google/sre-book/embracing-risk/)                                 | 2016 edition | 2026-09-25 | SKILL.md §1; SS6, SS7; EB8 — error budgets and the cost of nines |
| [Ch. 4 — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)             | 2016 edition | 2026-09-25 | SKILL.md §1; SS4, SS6                                            |
| [Ch. 6 — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | 2016 edition | 2026-09-25 | SKILL.md §3; BR5, BR6; RS2 — symptoms versus causes              |
| [Ch. 11 — Being On-Call](https://sre.google/sre-book/being-on-call/)                                  | 2016 edition | 2026-09-25 | RS3, RS4                                                         |
| [Ch. 14 — Managing Incidents](https://sre.google/sre-book/managing-incidents/)                        | 2016 edition | 2026-09-25 | SKILL.md §5; IH2–IH6, IH8; RS5 — roles, live document, handoff   |
| [Ch. 15 — Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/) | 2016 edition | 2026-09-25 | SKILL.md §6; PM1, PM3, PM5, PM6, PM9                             |
| [Appendix — Example Postmortem](https://sre.google/sre-book/example-postmortem/)                      | 2016 edition | 2026-09-25 | PM3, PM6 — the section structure                                 |

## The Site Reliability Workbook (Google, 2018), read online

| Reference                                                                                             | Version      | Checked    | Used for                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| [Ch. 2 — Implementing SLOs](https://sre.google/workbook/implementing-slos/)                           | 2018 edition | 2026-09-25 | SKILL.md §1, §2; SS3–SS5, SS9; EB2, EB4, EB7                                                     |
| [Ch. 5 — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)                             | 2018 edition | 2026-09-25 | SKILL.md §3; BR1–BR4, BR7 — table 5-8, multiwindow multi-burn-rate, low traffic                  |
| [Ch. 8 — On-Call](https://sre.google/workbook/on-call/)                                               | 2018 edition | 2026-09-25 | BR6, BR8; RS1, RS2, RS4, RS7                                                                     |
| [Ch. 9 — Incident Response](https://sre.google/workbook/incident-response/)                           | 2018 edition | 2026-09-25 | SKILL.md §5; IH1, IH3, IH6, IH7, IH9; RS6                                                        |
| [Ch. 10 — Postmortem Culture: Learning from Failure](https://sre.google/workbook/postmortem-culture/) | 2018 edition | 2026-09-25 | SKILL.md §6; PM2, PM4, PM7, PM8, PM10                                                            |
| [Appendix B — Example Error Budget Policy](https://sre.google/workbook/error-budget-policy/)          | 2018 edition | 2026-09-25 | SKILL.md §2; EB1–EB3, EB5, EB6; PM1 — freeze at zero, 20% single-incident postmortem, escalation |

## Specification and tooling

| Reference                                                   | Version                                              | Checked    | Used for                                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| [OpenSLO specification](https://github.com/OpenSLO/OpenSLO) | `apiVersion: openslo/v1`; Go SDK v0.9.2 (2026-05-20) | 2026-09-25 | SKILL.md §1; SS1, SS3, SS5, SS8 — SLO, SLI `ratioMetric`, `timeWindow`, `budgetingMethod` |
| [oslo — OpenSLO CLI](https://github.com/OpenSLO/oslo)       | 0.13.0 (2025-06-29)                                  | 2026-09-25 | SS2 — `oslo validate`                                                                     |

## Incident response

| Reference                                                                                                                                                                                    | Version                                             | Checked    | Used for                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| [NIST SP 800-61 Rev. 3 — Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | Rev. 3, final, April 2025; supersedes Rev. 2 (2012) | 2026-09-25 | SKILL.md §5; IH10 — the frame a security incident switches to |

## Deferred to elsewhere

- Secrets in runbooks and commands: the OWASP ASVS 5.0 row in
  [`docs/review-standards.md`](../../docs/review-standards.md) (RS8).
- Security incidents past evidence preservation: [`security-reviewer`](../security-reviewer/SKILL.md).
- Pipelines, rollout and rollback mechanics: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- Latency investigation and load tests: [`performance-engineer`](../performance-engineer/SKILL.md).
