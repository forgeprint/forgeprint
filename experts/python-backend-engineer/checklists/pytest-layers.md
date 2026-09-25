# pytest layers

Two layers and two static gates. Unit tests cover models and exception
mapping, which need nothing running. Integration tests run the ASGI or WSGI app
against a real PostgreSQL, because session scope and transactions cannot be
tested against a fake. ruff and mypy run before either.

| #   | Check                                                                                                                     | How                                                | Source                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| PY1 | pytest is pinned and `pytest` runs both layers with one command                                                           | read `pyproject.toml` and the CI job               | pytest 9.1                                                    |
| PY2 | Async tests use pytest-asyncio with the mode set in configuration                                                         | read `asyncio_mode` in `[tool.pytest.ini_options]` | pytest-asyncio 1.4                                            |
| PY3 | Each request model has a test sending an extra field and one exceeding each bound                                         | find the model tests                               | Pydantic 2.13; OWASP ASVS 5.0.0 V2                            |
| PY4 | Each domain exception has a test asserting status, `type` and `application/problem+json`                                  | count the tests against the exception classes      | RFC 9457 §3                                                   |
| PY5 | Endpoints are called in-process: `httpx.AsyncClient(transport=ASGITransport(app))`, `TestClient`, or Django's test client | read the integration fixtures                      | HTTPX 0.28 — ASGI transport; FastAPI 0.141 — Testing          |
| PY6 | Integration tests use PostgreSQL in a container, not SQLite                                                               | grep `PostgresContainer`                           | testcontainers-python 4.15                                    |
| PY7 | A test forces the second write of a unit of work to fail and asserts nothing was committed                                | find the rollback test                             | SQLAlchemy 2.0.54 — Session basics; Django 6.1 — transactions |
| PY8 | Retry and timeout tests replace the wait, not the clock: tenacity's `sleep` or `wait` is overridden                       | grep tests for `time.sleep` and real waits         | tenacity 9.1 — API                                            |
| PY9 | `ruff check` and `mypy --strict` run in CI and fail the build                                                             | read the CI job; both exit non-zero on a finding   | ruff 0.16.8; mypy 2.3                                         |

## Why each one

**PY6** decides whether PY7 is worth anything. SQLite has different
transaction semantics, different types and no `SELECT ... FOR UPDATE`; a
rollback test that passes on SQLite says nothing about PostgreSQL.

**PY9** is where most of this expert's other rows actually run. ASYNC, S113,
RUF006, B904, BLE001, G004 — each one is a ruff code, and a code that is not in
`select` or does not fail CI is a code nobody enforces.

**PY4** keeps the error contract stable. Clients branch on the problem `type`;
one test per exception class turns a renamed type into a visible failure rather
than a silent change.
