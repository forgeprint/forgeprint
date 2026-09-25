# Flask API

A Flask 3.1 JSON API on Postgres: an application factory with one blueprint
per resource, Flask-SQLAlchemy models and Flask-Migrate migrations, pydantic
validation at the boundary, RFC 9457 problem documents for every error, bearer
token verification with every row scoped to the caller, and gunicorn in a
non-root container. The tests run against a real Postgres and prove the
authorization, validation, error and configuration claims one by one.

## What you get

- `create_app(config)` and blueprints (`health`, `notes`), with nothing built
  at import time, so the tests construct the app they need.
- `Config.from_environ`: the only reader of the environment. Unset `APP_ENV`
  means production, and production refuses to start with a missing,
  placeholder or shorter-than-32-byte `JWT_SECRET` — gunicorn exits instead of
  serving, which the recipe checks against the built image.
- A `notes` resource that shows the pattern: `before_request` authentication
  for the whole blueprint, every query built from `owned()`, 404 for a note
  that is not the caller's, and a request body that may not name its owner.
- `from_body` / `from_query` validation with pydantic v2, answering 422 with a
  JSON Pointer to each failing field; 400, 405, 413 and 415 as problem
  documents too; and an unexpected exception logged in full and reported to
  the caller as a bare 500.
- Flask-Migrate migrations generated from the models, a test that fails when a
  model has no migration, and every migration run down and up on the test
  database.
- `/health` (touches nothing) and `/ready` (asks the database, 503 when it
  cannot).
- A multi-stage Dockerfile running gunicorn as UID 10001 with a
  `HEALTHCHECK`, a compose file with Postgres and a hardened `api` service
  (read-only root, all capabilities dropped), and a CI workflow with actions
  pinned by commit SHA that lints, formats, tests against a Postgres service
  and builds the image.

## Options

None. Postgres is the database: the tests exercise it, the migrations are
generated against it, and a second database would double the matrix for a
difference the ORM mostly hides.

## What it fits

- A synchronous JSON API where the team knows Flask, or wants its explicit
  extension model: each capability is a named extension bound in one factory,
  and nothing is wired by type annotations.
- A service in front of an identity provider that already issues JWTs, where
  each caller owns their own records.
- A codebase that will grow by blueprints: the auth hook, the `owned()` query
  and the three cross-caller tests are the template for each new one.
- Teams that deploy containers configured only by environment variables.

## What it is NOT for

- **An async, type-driven API.** Use `fastapi-service`: FastAPI derives
  validation, dependency injection and an OpenAPI document from type hints,
  and runs on an async stack. This blueprint is WSGI and synchronous on
  purpose; a view that awaits many slow upstreams at once belongs there.
- **Server-rendered pages, sessions and forms.** There are no templates, no
  cookies and no CSRF protection, because there is nothing for them to
  protect. Django is the usual server-rendered Python choice.
- **Issuing tokens or storing passwords.** It verifies HS256 tokens signed with
  a shared secret. `scripts/dev_token.py` signs local ones and is not in the
  image. Moving to an identity provider's RS256 keys means verifying against
  its JWKS and checking the issuer — a change to `app/auth.py` only.
- **Multi-tenancy.** Rows belong to a subject, not to an organisation; there is
  no tenant resolution. `dotnet-multitenant-saas-api` shows what tenant
  isolation costs when it is done properly.
- **Rate limiting (OWASP API4:2023).** Bodies are capped at 64 KiB and pages
  at 100 items, but nothing limits how often a caller asks. A reverse proxy or
  Flask-Limiter is where that goes, and the policy depends on the API.
- **CORS and browser callers.** No `Access-Control-*` headers are sent, so a
  browser on another origin cannot call it. Add Flask-CORS with an explicit
  origin list when a browser client exists.
- **An OpenAPI document.** Nothing generates one. If the contract has to be
  published, a spec-first tool or `fastapi-service` fits better than
  retrofitting one here.

## Trade-offs made on your behalf

- **pydantic v2 rather than marshmallow.** Both are maintained. pydantic
  validates into typed objects, reports every failing field with its location
  (which becomes the problem document's `pointer`), and is strict about JSON
  types when asked. marshmallow is the older Flask habit and works equally
  well; the boundary is two functions in `app/validation.py`, so swapping it is
  a local change.
- **PyJWT directly rather than Flask-JWT-Extended.** The extension also issues
  tokens, sets cookies and manages refresh flows — surface this service does
  not use. Verification is twenty lines in one module, with the algorithm,
  audience and required claims visible where a reviewer looks.
- **A `before_request` hook per blueprint rather than a decorator per route.**
  A decorator can be forgotten; membership in a blueprint cannot. The test that
  walks `app.url_map` is what keeps it honest.
- **404, not 403, for somebody else's note.** 403 confirms the id exists.
- **SQLAlchemy 2.0, not 2.1.** 2.1.0 was released the day before this
  blueprint and Flask-SQLAlchemy 3.1.1 predates it. The 2.0 line is the one the
  extension was released against.
- **The tests need Postgres.** No SQLite stand-in: the migrations, the index
  and the transaction behaviour under test are Postgres's. The recipe starts
  one in a container and creates a separate `app_test` database, because the
  tests downgrade their database to nothing on every run.
- **Unset `APP_ENV` is production.** A deployment that forgets the variable
  gets the strict checks, not the lenient ones.
- **The base image is pinned to a patch release** (`python:3.13.15-slim`), not
  a digest. A digest is byte-exact and also stops security patches arriving;
  bumping the patch tag is a reviewed one-line change.
- **gunicorn with sync workers.** Two by default through `WEB_CONCURRENCY`.
  Each worker handles one request at a time, which is the predictable model for
  a database-bound API; raise the count before reaching for threads or
  gevent.

## Cost of adoption

About fifteen minutes to run the recipe with images already pulled: Python
3.13 or newer, Docker and `curl`. Nothing needs an account or a paid service.
The first real decision after setup is where tokens come from — until an
identity provider signs them, only `scripts/dev_token.py` does.
