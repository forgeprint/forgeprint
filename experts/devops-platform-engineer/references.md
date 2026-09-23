# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist item rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-22.**

## Supply chain and the build

These rows also live in [`docs/review-standards.md`](../../docs/review-standards.md)
with their checked versions; this table says which checklist item uses which.

| Reference                                                           | Version                                                       | Checked    | Used for                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| [SLSA](https://slsa.dev/spec/v1.2/)                                 | v1.2                                                          | 2026-09-23 | `pipeline-integrity.md` PI1, PI8, PI9 — build track, reproducibility, provenance |
| [NIST SSDF, SP 800-218](https://csrc.nist.gov/projects/ssdf)        | v1.1                                                          | 2026-09-23 | PI7, `container-image.md` CN9                                                    |
| [OWASP Top 10:2025](https://owasp.org/Top10/2025/)                  | 2025 edition                                                  | 2026-09-23 | PI1 and PI4 under A03 Software Supply Chain Failures; `secrets-in-ci.md` SC2     |
| [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker) | v1.8.0 — verify a control number at the link before citing it | 2026-09-23 | All of `container-image.md`. Only the image-and-Dockerfile scope applies         |

## Delivery

| Reference                                                                                                                                                   | Version          | Checked    | Used for                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| [GitHub Actions — security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) | current at check | 2026-09-23 | `secrets-in-ci.md` SC1 to SC4 — permissions, fork triggers, and script injection through untrusted input |
| [Martin Fowler — ParallelChange](https://martinfowler.com/bliki/ParallelChange.html)                                                                        | current          | 2026-09-23 | `rollout-and-rollback.md` RR6, and why a rollback needs the previous version's schema to still exist     |
| [Martin Fowler — Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)                                                                   | current          | 2026-09-23 | RR4 — deploy and release as separate decisions                                                           |
| [Martin Fowler — Blue Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)                                                            | current          | 2026-09-23 | RR5, RR7                                                                                                 |

## Operating it

| Reference                                                                                                         | Version          | Checked    | Used for                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| [Google SRE Workbook — implementing SLOs](https://sre.google/workbook/implementing-slos/)                         | current          | 2026-09-23 | `slo-and-alerting.md` SL1 to SL4, SL7 — indicators, objectives, error budgets, multiwindow burn-rate alerts |
| [Google SRE Book — monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)   | current          | 2026-09-23 | SL5, SL8, SL9 — symptoms over causes, and what an alert costs when it is wrong                              |
| [Kubernetes — probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)         | current at check | 2026-09-23 | `container-image.md` CN7                                                                                    |
| [Kubernetes — pod termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) | current at check | 2026-09-23 | CN6 — signal handling and the grace period                                                                  |

## Deferred to elsewhere

- Whether the application's code is structured to be deployable and observable
  in the first place: [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET.
- Whether the suite that gates the pipeline is worth gating on:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md). That expert owns the
  signal; this one owns the pipeline.
- The application security review itself:
  [`security-reviewer`](../security-reviewer/SKILL.md). The overlap is
  deliberate and one-directional — this expert checks the pipeline's own
  security, not the application's.
- Schema migration mechanics: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
