# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

The Twelve-Factor App and OWASP ASVS are tracked in
[`docs/review-standards.md`](../../docs/review-standards.md); they are cited at
the versions recorded there. Everything else is listed with the version current
when it was read. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.**

## Method

| Reference                                                                                                                                  | Version                                               | Checked    | Used for                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Michael C. Feathers, _Working Effectively with Legacy Code_                                                                                | Prentice Hall, 2004, ISBN 9780131177055               | 2026-09-25 | ch. 2 the legacy code change algorithm (CT1, CT2, CT5); ch. 4 the seam model (SS1); ch. 13 characterization tests (CT3, CT4, CT6, BP1, UP8); ch. 25 dependency-breaking techniques (CT7) |
| Martin Fowler, _Refactoring_                                                                                                               | 2nd edition, Addison-Wesley, 2018, ISBN 9780134757599 | 2026-09-25 | CT7 named refactorings; CT8 and UP5 — ch. 2, the two hats: refactor or change behaviour, not both at once                                                                                |
| [Martin Fowler — Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)                                   | page dated 2024-08-22                                 | 2026-09-25 | SS2, SS6, BP6, DC1, DC2 — divert at the edge, grow the new around the old, transitional architecture                                                                                     |
| [Martin Fowler — Branch By Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html)                                           | page dated 2014-01-07                                 | 2026-09-25 | SS3, SS7, UP6, DC6, DC7 — replace behind an abstraction and release at every step                                                                                                        |
| [Danilo Sato — Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)                                                        | page dated 2014-05-13                                 | 2026-09-25 | SS4 — expand, migrate, contract                                                                                                                                                          |
| [Ian Cartwright, Rob Horn, James Lewis — Patterns of Legacy Displacement](https://martinfowler.com/articles/patterns-legacy-displacement/) | published 2024-03-05                                  | 2026-09-25 | SS5, SS8, BP2 to BP5, DC5 — Transitional Architecture, Extract Product Lines, Legacy Mimic, Divert the Flow, and Feature Parity named as a failure factor                                |

## Target shape and versions

| Reference                                                                   | Version                                                      | Checked    | Used for                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [The Twelve-Factor App](https://12factor.net/)                              | site states "last updated 2017"; tracked in review-standards | 2026-09-25 | BP7, UP7 (II Dependencies), DC3 (IV Backing services, XII Admin processes)                                                                                                                                            |
| [endoflife.date](https://endoflife.date/)                                   | API v1, response `schema_version` 1.2.1                      | 2026-09-25 | UP1 — support dates from a source, community-maintained and open source                                                                                                                                               |
| [Angular — Versioning and releases](https://angular.dev/reference/releases) | current at check                                             | 2026-09-25 | UP3, UP4 — named as **one example** of the pattern: a vendor that tells you to update one major version at a time, with a guide per step. The rule applies to any framework whose vendor publishes per-version guides |
| [Semantic Versioning](https://semver.org/spec/v2.0.0.html)                  | 2.0.0                                                        | 2026-09-25 | UP2 — a deprecation lands in a minor release before the removal in a major                                                                                                                                            |
| OWASP ASVS                                                                  | 5.0.0, via `docs/review-standards.md`                        | 2026-09-22 | DC4 — 13.3.1, secrets managed through their lifecycle, revocation included                                                                                                                                            |

The books were not re-read on the date above; their editions and ISBNs were
confirmed, and the chapter numbers are those of the editions named.

## Deferred to elsewhere

- Target architecture: a software architect —
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md) for .NET.
- Performance before and after: [`performance-engineer`](../performance-engineer/SKILL.md).
- Unit-level tests and doubles: [`test-engineer`](../test-engineer/SKILL.md).
- Routing, flags and rollout: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- Data migration and reconciliation: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
