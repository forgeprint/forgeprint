# Python Senior Backend Engineer

## What it changes

Python's failures in a web service are rarely exceptions. They are code that
runs: a coroutine calling `requests`, a pydantic model quietly dropping a field
the caller should not have sent, a session two tasks share, a `requests.get`
that waits forever. An agent without this expert writes all four, because each
one works in the first test. With it:

- **Request models forbid what they were not told about.** `extra="forbid"`,
  bounds on every string and list, a request class that is not the ORM class,
  and settings validated once at startup with no default for a secret.
- **The loop is protected by rules, not vigilance.** ruff's `ASYNC`, `S113` and
  `RUF006` selected and failing CI; the one case no rule catches — a sync
  SQLAlchemy session inside `async def` — grepped for by name.
- **A session is one unit of work.** One per request, never shared across
  tasks, `expire_on_commit=False` and no implicit lazy loads under asyncio; in
  Django, `atomic` without inner catches and `on_commit` for anything enqueued.
- **Exceptions chain and one handler speaks HTTP.** `raise ... from`, no blind
  `except`, domain exceptions mapped to RFC 9457 problem details, JSON logs with
  a correlation id bound through contextvars.
- **Shutdown has a number.** uvicorn's graceful-shutdown timeout set below the
  orchestrator's grace period, readiness failing first.

Six checklists and nine refusals, most of them a ruff code.

## What it fits

- FastAPI, Django or Flask services on Python 3.14, with PostgreSQL through
  SQLAlchemy 2.0 or the Django ORM.
- Reviewing an async Python codebase where latency rises under load for no
  visible reason — the event-loop checklist is written for exactly that.
- A service whose `pyproject.toml` has ruff and mypy configured but not
  selecting the rule sets that matter here.

## What it does not fit

- **Deciding the architecture.** Service boundaries, module layout and the
  persistence model are the architect's. The catalog's only architect today is
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md); Python ones
  are planned.
- **The API contract.** It keeps the generated OpenAPI checked in and diffed;
  what the contract should say is the API designer's call.
- **Security review.** It applies the validation, error and logging rows a
  backend engineer owns and hands the audit to
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Schema and query design** — [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Data science, notebooks, ML pipelines and scripts.** The rules assume a
  long-running web process with a request lifecycle.
- **Python below 3.11.** `asyncio.timeout` and `TaskGroup` are assumed.

## Pros and cons

**In its favour:** most rows are a ruff code or a command, so the expert's
effect can be switched on in `pyproject.toml` and stays on after the agent has
gone. It names the defaults that bite — pydantic ignoring extras, `requests`
never timing out, tenacity's bare `@retry` looping forever, uvicorn waiting
indefinitely on shutdown.

**Against it:** it covers three frameworks, and FastAPI gets the most concrete
guidance; a Flask or Django reader will translate some rows. It assumes
PostgreSQL and a container orchestrator. And it was drafted by a tool from
documentation rather than from somebody's review history, which
`provenance: generated` records.
