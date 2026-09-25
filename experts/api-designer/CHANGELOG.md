# Changelog

## 1.0.0 — 2026-09-24

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`). Not manually verified: the sources were
checked on 2026-09-24 and the lint command was run against a sample OAS 3.2.1
document, but the expert has not been used on a real API with callers.
`community` and `provenance: generated` say exactly that (ADR 0011).

- Contract first: `openapi.yaml` at OAS 3.2.1 and a committed `redocly.yaml`
  exist before any handler, and the pinned Redocly CLI 2.54.2 lint exits 0.
  The default rulesets leave the verb-in-path and problem-details rules off;
  the config switches them on.
- Methods and status codes as RFC 9110 defines them, cited by section, and
  `QUERY` (RFC 10008) for a read too large for a query string.
- One error shape: RFC 9457 problem details, defined once, referenced from
  every error response.
- Evolution: one recorded versioning scheme, breaking changes found by diffing
  the contracts, `deprecated: true`, `Deprecation` (RFC 9745) and `Sunset`
  (RFC 8594).
- Collections and retries: pagination with a maximum page size, bounds on
  every caller-controlled string and array, and a stated retry story for every
  non-idempotent `POST`. The `Idempotency-Key` header is cited as the expired
  draft it is.
- Contract security: what the contract can show against the OWASP API Security
  Top 10 2023, with the review itself deferred to `security-reviewer`.
- Six checklists, every row citing a source in `references.md`. Re-check due
  2026-12-23.
