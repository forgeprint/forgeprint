# Async boundaries

asyncio runs every coroutine on one thread. The architecture question is where
the line between sync and async code sits, and whether anything blocking has
crossed it.

| #   | Check                                                                                 | How                                                                          | Source                                                           |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| AS1 | Each process is recorded as sync, async, or mixed, with the mixing points named       | the ADR exists; the C4 container diagram agrees                              | Python 3.14 — Developing with asyncio                            |
| AS2 | No blocking HTTP, file or sleep call inside `async def`                               | `ruff check --select ASYNC210,ASYNC230,ASYNC251`                             | ruff 0.16 — flake8-async rules                                   |
| AS3 | Blocking work that must run from async code goes through `asyncio.to_thread`          | read each call into a sync library from a coroutine                          | Python 3.14 — `asyncio.to_thread`                                |
| AS4 | FastAPI: an endpoint or dependency that calls blocking code is `def`, not `async def` | read each `async def` route for sync drivers or clients                      | FastAPI — Concurrency and async / await                          |
| AS5 | Django: no synchronous ORM call from an async view; `a`-methods or `sync_to_async`    | read each `async def` view; `SynchronousOnlyOperation` in logs               | Django 6.1 — Asynchronous support                                |
| AS6 | Concurrent work runs in an `asyncio.TaskGroup`                                        | `grep -rn "gather(\|create_task(" src`                                       | Python 3.14 — Coroutines and Tasks                               |
| AS7 | Every bare `create_task` result is kept referenced                                    | `ruff check --select RUF006`                                                 | ruff 0.16 — `asyncio-dangling-task`; Python 3.14 — `create_task` |
| AS8 | Every outbound call has a deadline                                                    | `async with asyncio.timeout(...)` or the client's timeout, on each call site | Python 3.14 — `asyncio.timeout`                                  |
| AS9 | Development runs with asyncio debug mode, which reports slow callbacks                | `PYTHONASYNCIODEBUG=1` or `-X dev` in the dev script                         | Python 3.14 — Developing with asyncio                            |

## Why each one

**AS4** is FastAPI-specific and inverts the intuition. A plain `def` endpoint
is run in a threadpool; an `async def` endpoint runs on the loop. So wrapping a
blocking database driver in `async def` to "make it async" is the one change
that makes it block every other request.

**AS6** because `TaskGroup` cancels the siblings when one task fails and raises
the failures together, where a loose `gather` leaves the other tasks running
with nobody waiting for them.

**AS7** is documented in the standard library: the loop keeps only a weak
reference to a task, so a task nobody holds can be garbage-collected before it
finishes — and nothing reports that it did not run.
