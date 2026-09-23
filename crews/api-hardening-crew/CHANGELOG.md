# Changelog

## 1.0.0 — 2026-09-23

The catalog's second crew, and the counterpart to `saas-launch-crew`: that one
is for decisions taken before there is data, this one for a system that already
has users.

- Three members rather than four, deliberately. Each brings one question with a
  factual answer somebody either has or does not have, and finding out which
  takes an afternoon.
- The order is not the listing order: object-level authorization first, because
  it is the most common real API vulnerability and invisible to a scanner.
- The overlap between the platform engineer and the security reviewer is stated
  rather than hidden — one reviews the pipeline's security, the other the
  application's, and the finding that matters is usually at the join.
- `not_for` names greenfield, a system with no users, a known finding, and
  anything expecting a penetration test. This crew reads; it does not probe.

Two integrations: `github-mcp` and `playwright-mcp`.
