# FastAPI Service

A FastAPI service with SQLAlchemy, bearer token verification, a container image
and CI. It is the Python answer to the same question `dotnet-web-api` answers
in C#: a JSON API that authenticates its callers and ships as a container.

## What it fits

- A JSON API behind an identity provider that already issues tokens.
- A service that will be deployed as a container and configured entirely
  through environment variables.
- A Python team that wants the async stack — FastAPI, SQLAlchemy 2.0 async,
  asyncpg — rather than a synchronous one.

## What it is NOT for

- **Issuing tokens.** It verifies them. There is no login endpoint, no user
  table and no password handling, because a service that both issues and
  consumes its own tokens is usually two services that have not been separated
  yet.
- **Multi-tenancy.** There is no tenant resolution and no isolation boundary.
  Adding tenancy to a single-tenant schema afterwards is the expensive path;
  `dotnet-multitenant-saas-api` shows what it costs to do properly, and a
  Python equivalent does not exist yet.
- **Server-rendered pages.** No templates, no static files, no session cookies.
- **A synchronous codebase.** Everything here is `async`, and mixing a blocking
  database driver into an async stack is the most common way a FastAPI service
  becomes slower than the framework it replaced.
- **Migrations.** None are set up. Alembic is the answer and it is a decision
  with enough surface to make on purpose, when the model is real.
- **Rate limiting.** Nothing restricts how often a caller may ask
  (OWASP API4:2023). `slowapi` or a reverse proxy is where to start, and the
  policy depends on what the API is for, which is why the blueprint does not
  guess.

### The base image moves within a minor

`python:3.13-slim` is a tag, not a digest. That is deliberate and it is a
trade-off: a digest is byte-exact and also stops security patches arriving,
which for a base image is usually the wrong side to be on. Pin to a digest when
a build has to be reproducible to the byte, and take over patching when you
do.

## Trade-offs made on your behalf

- **Verification in one module.** `app/security.py` is the only place that
  reads the `Authorization` header, and the only place that calls
  `jwt.decode`. Every protected route depends on it. A second place doing that
  is how a service ends up with two definitions of "authenticated".
- **A missing token is 401.** FastAPI's bearer scheme answers 403 by default,
  which tells the caller the wrong thing: 403 means "you may not", 401 means
  "who are you". The scheme is registered with `auto_error=False` so this
  module can answer correctly.
- **One engine per process, created lazily.** The engine owns the connection
  pool. Making a second one doubles the pool against a database that has a
  fixed number of connections, and nothing complains until production.
- **Configuration only from the environment.** `pydantic-settings` with
  `extra="forbid"`, so a typo in a variable name fails at startup instead of
  silently leaving a default in place. The image is identical in every
  environment; only the environment differs.
- **`/health` touches nothing.** It answers while the database is down, on
  purpose: it reports that the process is alive, not that the system is well.
  A health check that queries the database turns a slow database into an
  outage.
- **Tests run through the ASGI transport.** No server, no port, no database —
  the app is called in-process. Four tests in under a second, which is what
  makes it plausible that anyone runs them.

## Cost of choosing it

Nothing here issues a token, so you need something that does before the
protected route is useful: an identity provider, or a script that signs one
with the same secret. The tests show the shape.

There are no migrations, so the first schema change is also the decision about
how schema changes reach an environment. That is deliberate — it is a decision
worth making once, deliberately, rather than inheriting from a starter.
