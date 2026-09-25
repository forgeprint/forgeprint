# Changelog

## 1.0.0 — 2026-09-24

First version. Drafted by a tool from the
[2026-09-24 role research](../../docs/research/2026-09-24-roles.md) under
[ADR 0015](../../docs/decisions/0015-experts-per-language.md), which lets an
expert be specific to a language when its checklists are about that language.
**Not manually verified**: every version, default and rule ID was read from its
source on 2026-09-24, but no person has yet run this expert against a real
service and reported what changed.

- `context.Context` threaded into every blocking call, enforced by `noctx`,
  `contextcheck`, `containedctx`, `fatcontext` and `go vet`'s `lostcancel`;
  Gin's `c.Copy()` rule for goroutines.
- `net/http` server and client timeouts replaced from their zero values (gosec
  G112, G114), bodies capped, unknown JSON fields rejected.
- Errors wrapped with `%w`, matched with `errors.Is` and `errors.As`, mapped
  once to RFC 9457; slog JSON logs with the trace id and redaction.
- `database/sql` and pgxpool limits set, rows and transactions always released,
  SQL built with placeholders only (gosec G201, G202).
- Goroutines owned and stoppable, `signal.NotifyContext` and `Server.Shutdown`
  for SIGTERM, goleak in tests and Go 1.27's `goroutineleak` profile in the
  process.
- Table-driven tests with `-race`, PostgreSQL through testcontainers-go, and
  `testing/synctest` for anything time-based.
- Six checklists, each row traced to a source in `references.md`.

Targets Go 1.27. `references.md` is due for re-reading on 2026-12-23.
