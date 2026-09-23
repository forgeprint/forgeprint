# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist item rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version that was current when it was last read, and the
date of that reading. **Re-check every 90 days.** A source cited at the wrong
version is worse than an uncited claim, because it sounds authoritative.

> **Next re-check due: 2026-12-22.**

## Platform

| Reference                                                                                                     | Version                                                                                           | Checked    | Used for                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)                 | .NET 10 is the current LTS, supported to November 2028; .NET 11 is STS and releases November 2026 | 2026-09-23 | The version this expert targets, and when that has to move                                                                                                        |
| [ASP.NET Core Best Practices](https://learn.microsoft.com/aspnet/core/fundamentals/best-practices)            | .NET 10 moniker; page revised 2025-12-29                                                          | 2026-09-23 | Most of `async-discipline.md`, and the data-access items in `transaction-boundary.md`. It is the source for every refusal in SKILL.md §5 that is not .NET-general |
| [Options pattern in ASP.NET Core](https://learn.microsoft.com/aspnet/core/fundamentals/configuration/options) | .NET 10                                                                                           | 2026-09-23 | `config-separation.md` C1 and C7 — binding, validation, and `ValidateOnStart`                                                                                     |
| [Safe storage of app secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets)                   | current at check                                                                                  | 2026-09-23 | `config-separation.md` C4, C5, C6                                                                                                                                 |
| [EF Core — tracking and no-tracking queries](https://learn.microsoft.com/ef/core/querying/tracking)           | EF Core 10                                                                                        | 2026-09-23 | `transaction-boundary.md` T3                                                                                                                                      |
| [TimeProvider](https://learn.microsoft.com/dotnet/api/system.timeprovider)                                    | .NET 8 and later                                                                                  | 2026-09-23 | The refusal of `DateTime.Now` in SKILL.md §5                                                                                                                      |
| [Nullable reference types](https://learn.microsoft.com/dotnet/csharp/nullable-references)                     | C# 14 / .NET 10                                                                                   | 2026-09-23 | The `Nullable` and warnings-as-errors requirement in SKILL.md §5                                                                                                  |

## Architecture

| Reference                                                                                                                                    | Version          | Checked    | Used for                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [.NET application architecture guides](https://dotnet.microsoft.com/learn/dotnet/architecture-guides)                                        | current at check | 2026-09-23 | The four-project shape in `layering.md`, and the vocabulary used for it                                                                                           |
| [Architecture decision records — Michael Nygard's original format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-23 | The ADR template in SKILL.md §1. Context / Decision / Consequences is his; Alternatives is this catalog's addition, and the reason it is required is stated there |
| [C4 model](https://c4model.com/)                                                                                                             | current at check | 2026-09-23 | Why only Context and Container diagrams are produced. The model's own guidance is that the lower two levels are optional and often not worth maintaining          |

## Observability

| Reference                                                                                                                                 | Version            | Checked    | Used for                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- | -------------------------------------------------------------------------- |
| [OpenTelemetry .NET](https://opentelemetry.io/docs/languages/dotnet/)                                                                     | current at check   | 2026-09-23 | `observability.md` O1 and O2 — `ActivitySource` naming and instrumentation |
| [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/)                                                        | current at check   | 2026-09-23 | O2 — what a span around a dependency is named and attributed with          |
| [W3C Trace Context](https://www.w3.org/TR/trace-context/)                                                                                 | W3C Recommendation | 2026-09-23 | O6 — propagation across the process boundary                               |
| [Kubernetes — liveness, readiness and startup probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes) | current at check   | 2026-09-23 | O5 — why the two endpoints are separate, and what each one may check       |

## Deferred to elsewhere

This expert does **not** restate application security. Two copies of a standard
is one copy that is wrong.

- Authentication, authorization, input validation, cryptography and
  configuration hardening: [`docs/review-standards.md`](../../docs/review-standards.md),
  which carries OWASP ASVS, the OWASP Top 10 and the API Security Top 10 at
  their checked versions.
- The security half of any review this expert is asked for:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Container and supply-chain controls: the CIS Docker Benchmark, NIST SSDF and
  SLSA rows in `docs/review-standards.md`.
