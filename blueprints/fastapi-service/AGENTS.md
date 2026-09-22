# FastAPI Service — agent context

A FastAPI service with SQLAlchemy async, bearer token verification and a
container image. Read this before changing anything under `app/`.

## The shape

```
app/settings.py    configuration, from the environment only
app/security.py    the only module that reads Authorization or decodes a token
app/db.py          one engine per process; the session dependency
app/main.py        the routes
tests/test_api.py  the app through the ASGI transport, no server, no database
```

## Rules that are not style preferences

**Verification happens in `app/security.py` and nowhere else.** No route reads
`request.headers["Authorization"]`, and nothing outside that module calls
`jwt.decode`. A protected route depends on `current_claims`. The moment there
are two places that decide who the caller is, they will disagree.

**`jwt.decode` is given `algorithms=` and an audience, always.** Decoding
without a pinned algorithm list accepts `alg: none` and tokens signed with the
wrong kind of key; without an audience, a token issued for another service
works here. Both are silent, and neither shows up in a test unless you write
the test that forges one — `tests/test_api.py` has it.

**Everything is `async`.** A blocking call inside an async route blocks the
event loop, and the service gets slower under load rather than faster. If a
library has no async client, run it with `anyio.to_thread.run_sync` rather than
calling it directly.

**One engine.** `app/db.py` holds it. Do not call `create_async_engine`
anywhere else: the engine owns the connection pool, and a second one doubles
it against a database that has a fixed number of connections.

**`/health` stays trivial.** It must not query the database. A health check
that touches a dependency turns a slow dependency into an outage, because the
orchestrator restarts a container that was answering fine.

**Configuration is read through `Settings`.** No `os.environ` in a route.
`extra="forbid"` means a misspelled variable fails at startup, which is the
only time anybody is watching.

## Adding a route

1. Put it in `app/main.py` — or a router module once there is more than a
   handful, imported there.
2. If it needs a caller: `claims: Annotated[dict[str, Any], Depends(current_claims)]`.
   That is the whole authentication story for the route.
3. If it needs the database:
   `session: Annotated[AsyncSession, Depends(session)]`.
4. Test it through the client in `tests/test_api.py`, not by calling the
   function. Dependencies, status codes and serialisation only exist on the
   round trip.

## The database

SQLAlchemy 2.0 async. `session` is a dependency that opens a session per
request and closes it afterwards. There are no models yet and no migrations:
when the first model is real, add Alembic then, and let that be a decision
rather than an inheritance.

Under the `sqlite` option the URL is a file and there is no service to run;
under `postgres` there is a `compose.yaml` for local development. Both use the
same code path, which is the reason the driver is the only difference.

## Configuration

| Variable        | What it is                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`  | SQLAlchemy async URL, for example `postgresql+asyncpg://app:…@localhost/app` |
| `JWT_SECRET`    | The signing key. At least 32 bytes for HS256, or PyJWT warns                 |
| `JWT_ALGORITHM` | `HS256` by default                                                           |
| `JWT_AUDIENCE`  | `api` by default; a token issued for something else is refused               |

None of them has a default that works in production, deliberately. `.env` is
for local development and is not in the image.

## What is not here

No token issuing, no users, no tenancy, no migrations, no rate limiting.
`overview.md` says which of those are deliberate omissions and why.
