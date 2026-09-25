# The event loop

One thread runs every coroutine in the process. Anything that blocks it —
a sync HTTP call, a sleep, a sync database driver — blocks every request at
once, and nothing in Python's type system notices.

| #    | Check                                                                                                           | How                                                                                                                 | Source                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| EV1  | ruff selects `ASYNC`, and `ruff check` is clean                                                                 | read `[tool.ruff.lint] select`; run `ruff check`                                                                    | ruff 0.16.8 — flake8-async rules                        |
| EV2  | No `requests`, `urllib.request` or `httpx.Client` call inside `async def`                                       | ASYNC210, ASYNC212; grep for the rest                                                                               | ruff 0.16.8 — ASYNC210, ASYNC212                        |
| EV3  | No `time.sleep`, builtin `open()` or `subprocess` inside `async def`                                            | ASYNC251, ASYNC230, ASYNC220                                                                                        | ruff 0.16.8 — ASYNC251, ASYNC230, ASYNC220              |
| EV4  | No sync SQLAlchemy `Session` inside `async def`; Django async views use the `a`-prefixed ORM or `sync_to_async` | grep `async def` bodies for `session.execute(` without `await`; Django's sync ORM raises `SynchronousOnlyOperation` | SQLAlchemy 2.0.54 — asyncio; Django 6.1 — async support |
| EV5  | In FastAPI, an endpoint that must call a blocking library is a plain `def`, or wraps the call in a thread       | read each `async def` endpoint's calls                                                                              | FastAPI 0.141 — Concurrency and async / await           |
| EV6  | No `asyncio.create_task` whose result is discarded; background tasks live in a `TaskGroup` or a kept set        | ruff RUF006                                                                                                         | Python 3.14 — asyncio tasks; ruff 0.16.8 — RUF006       |
| EV7  | Every outbound await has a deadline: `asyncio.timeout()` or an explicit client timeout                          | grep `await client.` and `await asyncio.` calls                                                                     | Python 3.14 — asyncio.timeout                           |
| EV8  | Every `requests` call passes `timeout=`                                                                         | ruff S113                                                                                                           | Requests 2.34 — Timeouts; ruff 0.16.8 — S113            |
| EV9  | The httpx timeout is set on the client explicitly rather than left at the 5-second default                      | read the `AsyncClient(...)` construction                                                                            | HTTPX 0.28 — Timeouts                                   |
| EV10 | CPU-heavy work (hashing, image or PDF processing) runs in a thread or process pool, not on the loop             | grep for the libraries; each call is wrapped                                                                        | Python 3.14 — asyncio, running blocking code            |

## Why each one

**EV4** is the one no linter finds. A sync SQLAlchemy call inside `async def`
is ordinary Python: it runs, returns the right rows, and holds the loop for the
full round trip to the database. Under load the latency of every endpoint
becomes the latency of the slowest query.

**EV6** is a disappearing write. The loop keeps only weak references to tasks,
so a task nobody holds can be collected before it finishes — an audit record or
a cache invalidation that sometimes never happens, with no error anywhere.

**EV8** exists because of a default. `requests` waits forever unless told
otherwise; a hung upstream holds a worker until the process is restarted.
