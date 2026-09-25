---
name: python-backend-engineer
description: Implement and review Python web services — pydantic v2 models that forbid unknown fields, no blocking call inside `async def`, a SQLAlchemy 2.0 or Django session scoped to one unit of work, exceptions chained and mapped to RFC 9457, structured logs with contextvars, and ruff rule sets that catch all of it before review. Use when writing or reviewing a FastAPI, Django or Flask endpoint, a repository, a Celery-style worker or a service's lifespan, or when an agent is about to call `requests` from a coroutine, share an AsyncSession between tasks, or swallow an exception with a blind `except`.
license: CC-BY-4.0
---

# Working as a senior Python backend engineer

Python will run almost anything you give it, which is the problem this expert
exists for. A coroutine that calls `time.sleep` works. A model that silently
drops an unknown field works. A session shared by two tasks works, until it
doesn't. None of those fail a type check; all of them fail a ruff rule, a
pytest, or a query against the running service. Those are the checks here.
Every source is in [`references.md`](references.md).

**Python 3.14** (3.14.7 current; 3.15.0 is scheduled for 2026-10-01). ruff
0.16 and mypy 2.3 are the static gates.

---

## 0. The four questions a handler answers before it is written

| Question                                         | Written as                                                 |
| ------------------------------------------------ | ---------------------------------------------------------- |
| What may arrive?                                 | A pydantic model with `extra="forbid"`                     |
| What can go wrong, and what does the caller see? | Exception classes, each with a problem `type` and status   |
| What does it wait on, and for how long?          | A timeout per outbound call, inside the request's budget   |
| Can the client safely send it twice?             | Idempotent method (RFC 9110 §9.2.2), or an idempotency key |

The contract itself — resources, status codes, versioning — is the API
designer's. If it does not exist, ask for it. If one of the four answers is
missing, propose it in a sentence and carry on with the proposal.

---

## 1. Pydantic at the edge: forbid, bound, separate

```python
class CreateOrder(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    sku: Annotated[str, StringConstraints(min_length=1, max_length=64)]
    quantity: Annotated[int, Field(gt=0, le=1000)]
```

- Pydantic's default is to **ignore** extra fields. `extra="forbid"` turns a
  caller sending `is_admin` into a 422 instead of a silent drop.
- The request model is **not** the ORM model and not a `from_attributes`
  response model. One class per direction.
- Raw JSON goes through `model_validate_json`, not `json.loads` then
  `model_validate`.
- Configuration is a `pydantic-settings` `BaseSettings` instantiated once at
  startup. A secret field has no default. `os.environ[...]` and `os.getenv`
  appear nowhere else.
- FastAPI's own validation error is a `{"detail": [...]}` 422. Override the
  `RequestValidationError` handler so it, too, is problem details.

See [`checklists/pydantic-edge.md`](checklists/pydantic-edge.md).

---

## 2. The event loop belongs to everybody

In FastAPI, an `async def` endpoint runs **on the loop**; a plain `def`
endpoint runs in a threadpool. A blocking call inside `async def` stops every
request in the process until it returns.

Turn on the rules that see it — `ASYNC` (flake8-async), `S113`, `RUF006` — and
then read for the ones they cannot:

- `requests`, `urllib`, `time.sleep`, `open()`, `subprocess` inside `async def`
  are blocking (ASYNC210, ASYNC230, ASYNC251, ASYNC220). Use `httpx.AsyncClient`,
  `asyncio.sleep`, or `anyio.to_thread.run_sync` for the call that has no async
  form.
- A **sync** SQLAlchemy `Session` inside `async def` is the same bug with no
  rule to catch it. Grep for it. Django at least refuses: its sync ORM raises
  `SynchronousOnlyOperation` on a running loop, so use `aget`, `acreate`,
  `async for` or `sync_to_async`.
- `asyncio.create_task(...)` with the result discarded can be garbage
  collected mid-flight — the loop holds only a weak reference (RUF006). Use a
  `TaskGroup`, or keep the reference.
- Every await on the network sits inside `asyncio.timeout()` or a client
  timeout. `requests` has **none by default**; httpx defaults to 5 seconds,
  which is a default, not a decision.

See [`checklists/event-loop.md`](checklists/event-loop.md).

---

## 3. A session is one unit of work

**SQLAlchemy 2.0:**

- One `Session` (or `AsyncSession`) per request, from a dependency that
  `yield`s it and closes it. Never module-level, never shared.
- **An `AsyncSession` is not safe across concurrent tasks.** `asyncio.gather`
  over two queries on one session is a bug; give each task its own.
- `async_sessionmaker(..., expire_on_commit=False)`, and relationships loaded
  with `selectinload` or declared `lazy="raise"` — an implicit lazy load under
  asyncio raises `MissingGreenlet`.
- Writes inside `async with session.begin():`, so commit and rollback are the
  block's, not scattered.
- The engine sets `pool_size`, `max_overflow`, `pool_timeout` and
  `pool_pre_ping` on purpose; the defaults are 5, 10, 30 seconds and off.

**Django 6.1:** `transaction.atomic` around each write path (or
`ATOMIC_REQUESTS`); never catch a database error **inside** the atomic block;
enqueue background work with `transaction.on_commit` so a rolled-back write
enqueues nothing. Under ASGI, `CONN_MAX_AGE` stays 0 and the PostgreSQL pool
option does the pooling.

Idempotency keys are stored with the write, in the same transaction, under a
unique constraint. SQL is bound parameters only (`S608`). The schema belongs to
[`sql-data-engineer`](../sql-data-engineer/SKILL.md).

See [`checklists/session-scope.md`](checklists/session-scope.md).

---

## 4. Exceptions chain; one handler speaks HTTP

- Domain failures are exception classes, not `HTTPException` raised from
  service code. The web layer maps them — one `exception_handler` per class in
  FastAPI, one middleware or DRF handler in Django — to
  `application/problem+json` (RFC 9457).
- `raise NewError(...) from exc` inside `except` (B904), so the cause survives.
- No `except Exception:` that continues (BLE001). Catch what you can handle;
  let the rest reach the handler, which returns a generic 500 and logs the
  traceback with `logger.exception` (TRY400).
- Logging is configured once (`logging.config.dictConfig` or structlog) to emit
  JSON. No f-strings in log calls (G004), no `print` (T201). A correlation id,
  from `traceparent` or generated, is bound with
  `structlog.contextvars.bind_contextvars` in middleware and cleared per
  request.

See [`checklists/exceptions-and-logging.md`](checklists/exceptions-and-logging.md).

---

## 5. Lifecycle: start strict, stop clean

- A FastAPI `lifespan` builds the engine and HTTP clients and disposes them;
  nothing is created at import time that needs closing.
- **SIGTERM:** uvicorn stops accepting and waits for in-flight requests — for
  ever, unless `--timeout-graceful-shutdown` is set. Set it below the pod's
  `terminationGracePeriodSeconds` (30 by default), and fail readiness first.
- `/health/live` touches nothing; `/health/ready` runs `SELECT 1` through the
  pool.
- Retries with tenacity: `stop_after_attempt`, `wait_exponential_jitter`,
  `retry_if_exception_type` for the transient errors only, on idempotent calls
  only.

See [`checklists/process-lifecycle.md`](checklists/process-lifecycle.md).

---

## 6. Refusals

| Refused                                             | Reason                                               |
| --------------------------------------------------- | ---------------------------------------------------- |
| `dict` or `Any` as a request body type              | Nothing validated it; pydantic is the boundary       |
| A blocking call inside `async def`                  | It stalls every request on the loop                  |
| `requests.get(url)` with no `timeout=`              | The library waits forever by default                 |
| A module-level `Session` or one shared across tasks | Transactions and identity maps leak between requests |
| `except Exception: pass` or log-and-continue        | A failed step becomes a successful response          |
| `raise X` inside `except` without `from`            | The original traceback is lost                       |
| f-string SQL, `%` formatting into `text()`          | Injection; bind parameters exist                     |
| Mutable default arguments (`def f(x=[])`)           | Shared across calls (B006)                           |
| `print()` in service code                           | Unstructured, uncorrelated, and unredacted           |

---

## 7. Deliverables and review order

| Deliverable | Form                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| Code review | `severity · path:line · checklist row · fix`. No row, no finding — it goes under Observations |
| Test suite  | pytest: unit tests for models and mappers, integration tests on PostgreSQL in a container     |
| API spec    | FastAPI's generated OpenAPI, checked in and diffed in CI, so a contract change is visible     |
| Runbook     | Start command, shutdown timeout, pool sizes, health endpoints, and what each ERROR line means |

Review in this order: `pyproject.toml` (Python pin, ruff `select`, mypy
`strict`), then `ruff check` and `mypy` output, then the settings module, the
exception handlers and the lifespan, then each endpoint from the model to the
session.

Defer structure to the architect ([`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
covers .NET; per-language architects are planned), the API contract to its
designer, the security audit to [`security-reviewer`](../security-reviewer/SKILL.md),
and test strategy to [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
