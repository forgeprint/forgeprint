# Changelog

## 1.0.0 — 2026-09-24

First version. Drafted by a tool from the
[2026-09-24 role research](../../docs/research/2026-09-24-roles.md) under
[ADR 0015](../../docs/decisions/0015-experts-per-language.md), which lets an
expert be specific to a language when its checklists are about that language.
**Not manually verified**: every version was read from its source on
2026-09-24, but no person has yet run this expert against a real service and
reported what changed.

- The edge parsed with zod 4, `z.strictObject` for bodies, the environment
  parsed once at startup.
- Promise discipline enforced by typescript-eslint 8.70: no floating or misused
  promises, no `unhandledRejection` listener that continues, Express pinned to 5.
- Typed errors mapped in one place to RFC 9457 problem details, with an
  exhaustiveness lint on the mapper; pino logs with redaction and a correlation
  id carried by `AsyncLocalStorage`.
- node-postgres transactions on one client, a pool with explicit limits and an
  error listener, idempotency keys stored in the write's own transaction.
- An `AbortSignal` deadline on every outbound call, explicit server timeouts,
  and a SIGTERM path that is tested by sending the signal.
- Six checklists, each row traced to a source in `references.md`.

Targets Node.js 24 LTS and TypeScript 6.0 for type-aware linting.
`references.md` is due for re-reading on 2026-12-23, and sooner when Node.js 26
enters LTS on 2026-10-28.
