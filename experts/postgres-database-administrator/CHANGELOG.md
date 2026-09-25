# Changelog

## 1.0.0 — 2026-09-24

The catalog's first operator of a database rather than author of one: the
person who answers for it when it is slow, locked, full, breached or gone.

- A backup counts only once a restore of it has been run, timed and checked,
  with the result committed. `pg_verifybackup` is a precondition, not the test.
- Every new index is committed with the `EXPLAIN (ANALYZE, BUFFERS)` output that
  asked for it, before and after; every index dropped is committed with the
  usage statistics that condemned it.
- No DDL runs without a `lock_timeout` and a retry, and `squawk` lints every
  migration file before review. Lock levels are read from the documentation,
  not remembered.
- The application connects as a role that owns nothing, over TLS with the
  server certificate verified, authenticated by SCRAM; timeouts and connection
  limits are set per role, never cluster-wide.
- Integrity is asked of the catalog: unvalidated constraints, invalid indexes,
  foreign keys with no index, and `amcheck` on the indexes that matter.
- Six checklists and twelve refusals, pinned to PostgreSQL 18.

`provenance: generated` — drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, row 13), not manually verified. Nobody has
yet run it against a production cluster and reported what it changed; that
report is the evidence it most needs.
