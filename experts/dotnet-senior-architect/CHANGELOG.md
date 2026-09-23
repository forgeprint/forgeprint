# Changelog

## 1.0.0 — 2026-09-23

The catalog's first expert.

- Four decisions taken in writing before any code: the persistence boundary,
  the public contract, the auth model, the process boundary. As ADRs, with
  Consequences and Alternatives required rather than optional.
- Dependency direction enforced by `dotnet list ... reference` and by an
  architecture test, not by a folder name.
- Configuration bound with `ValidateOnStart()`, never injected as
  `IConfiguration`, never defaulted when it is a secret.
- One transaction boundary per request; repositories stage and do not commit.
- Eleven refusals, each one a documented ASP.NET Core or .NET failure mode.
- Observability decided at design time: one `ActivitySource`, message
  templates, liveness and readiness split.
- Six checklists, each item traced to a source in `references.md`.
- Security is deferred to `security-reviewer` and `docs/review-standards.md`
  rather than restated.

Targets .NET 10 (LTS). `references.md` is due for re-reading on 2026-12-22, and
again when .NET 11 ships in November 2026.
