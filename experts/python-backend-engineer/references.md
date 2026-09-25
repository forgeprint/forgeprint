# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Package versions were read from PyPI, rule codes from ruff's source at the
`0.16.8` tag, and behaviour from each project's documentation, all on the date
shown. **Re-check every 90 days**, and as soon as Python 3.15.0 ships on its
scheduled date, 2026-10-01.

> **Next re-check due: 2026-12-23.**

## Language and runtime

| Reference                                                                                      | Version                                              | Checked    | Used for                                                   |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| [PEP 745 — Python 3.14 release schedule](https://peps.python.org/pep-0745/)                    | 3.14.7 current                                       | 2026-09-24 | The target version in SKILL.md; `process-lifecycle.md` PL9 |
| [PEP 790 — Python 3.15 release schedule](https://peps.python.org/pep-0790/)                    | 3.15.0rc2 on 2026-09-01; final scheduled 2026-10-01  | 2026-09-24 | When this expert's target has to be re-read                |
| [Python 3.14 — Coroutines and tasks](https://docs.python.org/3.14/library/asyncio-task.html)   | 3.14.7; `asyncio.timeout` and `TaskGroup` since 3.11 | 2026-09-24 | `event-loop.md` EV6, EV7; `process-lifecycle.md` PL8       |
| [Python 3.14 — Developing with asyncio](https://docs.python.org/3.14/library/asyncio-dev.html) | 3.14.7                                               | 2026-09-24 | EV10 — running blocking code off the loop                  |
| [Python 3.14 — logging.config](https://docs.python.org/3.14/library/logging.config.html)       | 3.14.7                                               | 2026-09-24 | `exceptions-and-logging.md` XL9                            |

## Validation and frameworks

| Reference                                                                                         | Version                                                                          | Checked    | Used for                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| [Pydantic — Models](https://pydantic.dev/docs/validation/latest/concepts/models/)                 | pydantic 2.13.5; extra data ignored by default                                   | 2026-09-24 | `pydantic-edge.md` PE2, PE5; `pytest-layers.md` PY3              |
| [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)                 | pydantic-settings 2.15.0                                                         | 2026-09-24 | PE6                                                              |
| [FastAPI — Concurrency and async / await](https://fastapi.tiangolo.com/async/)                    | fastapi 0.141.1                                                                  | 2026-09-24 | EV5 — `def` runs in a threadpool, `async def` on the loop        |
| [FastAPI — Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/)               | fastapi 0.141.1; default validation error is 422 `{"detail": [...]}`             | 2026-09-24 | PE8, XL1                                                         |
| [FastAPI — Request Body](https://fastapi.tiangolo.com/tutorial/body/)                             | fastapi 0.141.1                                                                  | 2026-09-24 | PE1                                                              |
| [FastAPI — Lifespan Events](https://fastapi.tiangolo.com/advanced/events/)                        | fastapi 0.141.1                                                                  | 2026-09-24 | PL1                                                              |
| [FastAPI — Async Tests](https://fastapi.tiangolo.com/advanced/async-tests/)                       | fastapi 0.141.1                                                                  | 2026-09-24 | PY5                                                              |
| [Django — Database transactions](https://docs.djangoproject.com/en/6.1/topics/db/transactions/)   | Django 6.1.1                                                                     | 2026-09-24 | `session-scope.md` SS5, SS6, SS7; PY7                            |
| [Django — Databases](https://docs.djangoproject.com/en/6.1/ref/databases/)                        | Django 6.1.1; PostgreSQL `pool` option needs psycopg 3.1.12+ and `psycopg[pool]` | 2026-09-24 | SS9 — `CONN_MAX_AGE` 0 under ASGI                                |
| [Django — Asynchronous support](https://docs.djangoproject.com/en/6.1/topics/async/)              | Django 6.1.1                                                                     | 2026-09-24 | EV4 — `SynchronousOnlyOperation`, the async ORM, `sync_to_async` |
| [Flask — Handling Application Errors](https://flask.palletsprojects.com/en/stable/errorhandling/) | flask 3.1.3                                                                      | 2026-09-24 | XL2 in a Flask service — `errorhandler` per exception class      |

## Data access

| Reference                                                                                      | Version                                                                          | Checked    | Used for           |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------- | ------------------ |
| [SQLAlchemy — Asynchronous I/O](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) | 2.0.54, released 2026-09-15                                                      | 2026-09-24 | SS2, SS3, SS4, EV4 |
| [SQLAlchemy — Session basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)       | 2.0.54                                                                           | 2026-09-24 | SS1, SS5, PY7      |
| [SQLAlchemy — Engine configuration](https://docs.sqlalchemy.org/en/20/core/engines.html)       | 2.0.54; `pool_size` 5, `max_overflow` 10, `pool_timeout` 30, `pool_pre_ping` off | 2026-09-24 | SS8                |

## HTTP clients, logging, retries

| Reference                                                                                | Version                                                       | Checked    | Used for              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------- | --------------------- |
| [Requests — Timeouts](https://requests.readthedocs.io/en/latest/user/advanced/#timeouts) | requests 2.34.2; no timeout unless set                        | 2026-09-24 | EV8                   |
| [HTTPX — Timeouts](https://www.python-httpx.org/advanced/timeouts/)                      | httpx 0.28.1; 5 seconds of inactivity by default              | 2026-09-24 | EV9                   |
| [HTTPX — Transports](https://www.python-httpx.org/advanced/transports/)                  | httpx 0.28.1                                                  | 2026-09-24 | PY5 — `ASGITransport` |
| [structlog — Context variables](https://www.structlog.org/en/stable/contextvars.html)    | structlog 26.1.0                                              | 2026-09-24 | XL9, XL10             |
| [tenacity — API](https://tenacity.readthedocs.io/en/latest/api.html)                     | tenacity 9.1.4; bare `@retry` retries forever without waiting | 2026-09-24 | PL6, PY8              |
| [Uvicorn — Settings](https://uvicorn.dev/settings/)                                      | uvicorn 0.53.0; `--timeout-graceful-shutdown` has no default  | 2026-09-24 | PL2                   |

## Static analysis and tests

| Reference                                                                                                                 | Version                                                                                    | Checked    | Used for                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ruff — Rules](https://docs.astral.sh/ruff/rules/)                                                                        | 0.16.8, released 2026-09-16; codes read from `crates/ruff_linter/src/codes.rs` at that tag | 2026-09-24 | ASYNC210, ASYNC212, ASYNC220, ASYNC230, ASYNC251, RUF006, S113, S608, B006, B904, BLE001, E722, TRY400, G004, T201 — EV1–EV3, EV6, EV8, SS10, XL4–XL8, PY9 |
| [mypy — command line](https://mypy.readthedocs.io/en/stable/command_line.html)                                            | mypy 2.3.1                                                                                 | 2026-09-24 | PY9 — `--strict`                                                                                                                                           |
| [pytest](https://docs.pytest.org/en/stable/)                                                                              | pytest 9.1.1                                                                               | 2026-09-24 | PY1                                                                                                                                                        |
| [pytest-asyncio — Configuration](https://pytest-asyncio.readthedocs.io/en/latest/reference/configuration.html)            | pytest-asyncio 1.4.0                                                                       | 2026-09-24 | PY2                                                                                                                                                        |
| [testcontainers-python — PostgreSQL](https://testcontainers-python.readthedocs.io/en/latest/modules/postgres/README.html) | testcontainers 4.15.0                                                                      | 2026-09-24 | PY6                                                                                                                                                        |

## HTTP and operations

| Reference                                                                                                               | Version                                       | Checked    | Used for                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)                                                     | June 2022, Internet Standard                  | 2026-09-24 | §9.2.2 idempotent methods — SS11, PL7                                                              |
| [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)                                      | July 2023, obsoletes RFC 7807                 | 2026-09-24 | §3 — PE8, XL2, PY4; §5 — XL3                                                                       |
| [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/07/) | draft-07, 2025-10-15, **expired**             | 2026-09-24 | SS11. The clearest description of the convention; it never became a standard, and is cited as such |
| [W3C Trace Context](https://www.w3.org/TR/trace-context/)                                                               | Level 1, W3C Recommendation                   | 2026-09-24 | XL10                                                                                               |
| [Kubernetes — Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)                         | Kubernetes 1.37; grace period 30 s by default | 2026-09-24 | PL2, PL3, PL4                                                                                      |

## Tracked in `docs/review-standards.md`

Cited by chapter or factor in the checklists and not restated here.

| Standard                  | Version in `docs/review-standards.md` | Rows that cite it                   |
| ------------------------- | ------------------------------------- | ----------------------------------- |
| OWASP ASVS                | 5.0.0 — V1, V2, V16                   | PE1, PE3, PE9, SS10, XL3, XL11, PY3 |
| OWASP API Security Top 10 | 2023 — API3, API4                     | PE3, PE4                            |
| The Twelve-Factor App     | III Config, IX Disposability          | PE6, PE7, PL5                       |

The security review itself belongs to [`security-reviewer`](../security-reviewer/SKILL.md).
