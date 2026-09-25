# Changelog

## 1.0.0 — 2026-09-24

First version. Drafted by a tool from the
[2026-09-24 role research](../../docs/research/2026-09-24-roles.md) under
[ADR 0015](../../docs/decisions/0015-experts-per-language.md), which lets an
expert be specific to a language when its checklists are about that language.
**Not manually verified**: every version and rule code was read from its source
on 2026-09-24, but no person has yet run this expert against a real service and
reported what changed.

- Pydantic 2.13 request models with `extra="forbid"` and bounds, a separate
  class per direction, and `pydantic-settings` validated at startup.
- The event loop guarded by ruff 0.16.8's `ASYNC`, `S113` and `RUF006`, plus a
  named grep for sync SQLAlchemy sessions inside coroutines.
- SQLAlchemy 2.0 sessions scoped to one unit of work and never shared across
  tasks; Django 6.1 `atomic`, `on_commit` and the PostgreSQL pool under ASGI.
- Exceptions chained with `from`, mapped once to RFC 9457 problem details, and
  logged as JSON with a contextvars correlation id.
- A lifespan that owns its clients, a graceful-shutdown timeout below the
  orchestrator's grace period, and tenacity retries with a stop and jitter.
- Six checklists, each row traced to a source in `references.md`.

Targets Python 3.14. `references.md` is due for re-reading on 2026-12-23, and
sooner: Python 3.15.0 is scheduled for 2026-10-01.
