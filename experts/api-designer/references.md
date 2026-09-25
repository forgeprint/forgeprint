# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version that was current when it was read and the date of
that reading. **Re-check every 90 days.** A source cited at the wrong version is
worse than an uncited claim, because it sounds authoritative.

> **Next re-check due: 2026-12-23.**

## The contract

| Reference                                                          | Version                                                                                                                                                   | Checked    | Used for                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [OpenAPI Specification](https://spec.openapis.org/oas/v3.2.1.html) | **3.2.1**, published 2026-09-10; the 3.2 schema is dated 2026-08-30. 3.2.0 is the previous release of the same minor                                      | 2026-09-24 | `contract-first.md`, `evolution.md`, `contract-security.md`. 3.2 adds the `query` field on a Path Item, the `querystring` parameter location and `additionalOperations`                                                             |
| [JSON Schema](https://json-schema.org/specification)               | **2020-12** — still the current release; the previous was 2019-09                                                                                         | 2026-09-24 | `contract-first.md` CF6; the `maximum`, `maxLength` and `maxItems` bounds in `collections-and-retries.md`                                                                                                                           |
| [Redocly CLI](https://redocly.com/docs/cli/commands/lint)          | **2.54.2** on npm (`@redocly/cli`), published 2026-09-24. Lints OpenAPI 3.2; the pinned command was run against an OAS 3.2.1 document on the date checked | 2026-09-24 | The pinned lint command in SKILL.md §1, and the rule names cited in the checklists: `no-http-verbs-in-paths`, `operation-4xx-response`, `operation-4xx-problem-details-rfc7807`, `security-defined`, `operation-operationId-unique` |

**Why not Spectral.** `@stoplight/spectral-cli` 6.16.3 (2026-08-03) is its
latest release. OpenAPI 3.2 support was merged upstream on 2026-09-17 but had
not shipped in a release on the date checked. A linter that cannot read the
declared version cannot be the gate. If a project already runs Spectral on an
OAS 3.1 contract, keep it and pin it; re-check at the next review date.

## HTTP

| Reference                                                                                                            | Version                                                                                         | Checked    | Used for                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| [RFC 9110 — HTTP Semantics](https://datatracker.ietf.org/doc/rfc9110/)                                               | STD 97, June 2022; not updated or obsoleted by a later RFC                                      | 2026-09-24 | `http-semantics.md` throughout; `collections-and-retries.md` CR5–CR7. Section numbers are cited per row                  |
| [RFC 10008 — The HTTP QUERY Method](https://datatracker.ietf.org/doc/rfc10008/)                                      | Proposed Standard, June 2026. QUERY is safe, idempotent, and its response is cacheable          | 2026-09-24 | `http-semantics.md` H2, H4                                                                                               |
| [RFC 9457 — Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/rfc9457/)                                | Proposed Standard, July 2023; obsoletes RFC 7807; not obsoleted since                           | 2026-09-24 | `error-model.md` throughout                                                                                              |
| [RFC 9745 — The Deprecation HTTP Response Header Field](https://datatracker.ietf.org/doc/rfc9745/)                   | Proposed Standard, March 2025                                                                   | 2026-09-24 | `evolution.md` EV5, EV6                                                                                                  |
| [RFC 8594 — The Sunset HTTP Header Field](https://datatracker.ietf.org/doc/rfc8594/)                                 | Informational, May 2019; not obsoleted                                                          | 2026-09-24 | `evolution.md` EV6                                                                                                       |
| [RFC 8288 — Web Linking](https://datatracker.ietf.org/doc/rfc8288/)                                                  | Proposed Standard, October 2017; obsoletes RFC 5988                                             | 2026-09-24 | `collections-and-retries.md` CR3                                                                                         |
| [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | **Expired Internet-Draft**, revision 07 of 2025-10-15. Not a standard, and cited as one nowhere | 2026-09-24 | `collections-and-retries.md` CR5 — the header name only, with the instruction to say in the ADR that it rests on a draft |

## Security

This expert holds no security standard of its own. The OWASP rows live in
[`docs/review-standards.md`](../../docs/review-standards.md), and two copies of a
standard is one copy that is wrong.

| Reference                                                                                           | Version                                                                                                 | Checked    | Used for                                                                                   |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| OWASP API Security Top 10 — the row in [`docs/review-standards.md`](../../docs/review-standards.md) | 2023 edition. Re-confirmed on the date checked that no newer edition is published at the project's site | 2026-09-24 | `contract-security.md` (API1, API3, API5, API8, API9); `collections-and-retries.md` (API4) |

## Practice

| Reference                                                                              | Version | Checked    | Used for                                                            |
| -------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------------------- |
| ADR practice — the row in [`docs/review-standards.md`](../../docs/review-standards.md) | current | 2026-09-22 | `contract-first.md` CF8, `evolution.md` EV1; the ADR in SKILL.md §1 |
| CLAUDE.md §5c                                                                          | —       | 2026-09-24 | The report shape: severity, place, source, fix, and the verdict     |

## Deferred to elsewhere

- The security review itself: [`security-reviewer`](../security-reviewer/SKILL.md).
- Prose documentation around the contract:
  [`technical-writer`](../technical-writer/SKILL.md).
- Architecture behind the contract: [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET, or the architect for the stack in use.
