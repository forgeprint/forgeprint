# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.1 — 2026-09-22

Closes the findings of the architecture and security review
([report](../../docs/reviews/fastapi-service/2026-09-22.md)). No `high`
findings; this is the only blueprint in the catalog that did not overclaim its
authorization story.

- **The container check uses a database URL the image can actually open.** It
  passed a sqlite URL under both options, and under `postgres` the image
  installs `asyncpg` and not `aiosqlite`. The check passed anyway, because the
  engine is created lazily and `/health` touches nothing — which is worth
  proving, but a reader reasonably read it as "the container works with this
  configuration". A verification that passes for a reason other than the one
  the reader assumes is one that stops being checked.
- **Configuration is read once, while the process starts.** `Settings`
  requires `DATABASE_URL` and `JWT_SECRET` and raises without them, which is
  right — but it was only read from a request dependency, so a missing variable
  answered 500 to every call while `/health` still returned 200 and an
  orchestrator called the container ready. Failing closed has to mean failing
  to start.

  It is read in a lifespan handler rather than at import. The first attempt
  called `get_settings()` at module level and broke the test suite, which
  imports the app to drive it in-process and supplies its own environment
  afterwards. The lifespan runs under `uvicorn` — so the container check proves
  it — and not under the in-process transport the tests use, which is the
  correct split.

- Documented what is deliberately absent: rate limiting (API4:2023), and why
  the base image is pinned to a minor rather than a digest.

## 1.0.0 — 2026-09-22

First release.

- FastAPI 0.141.1 with SQLAlchemy 2.0.54 async, pydantic-settings 2.15.0 and
  PyJWT 2.14.0, every version pinned with `==`.
- Token verification lives in one module and nothing else reads the
  `Authorization` header. A missing token is 401, not the framework's 403: the
  bearer scheme is registered with `auto_error=False` so the answer for "no
  credentials" is the right one.
- One engine per process, created lazily. A second engine quietly doubles the
  connection pool and halves what the database can serve, so the module makes
  that hard to do by accident.
- `database` option: `postgres` (asyncpg 0.31.0, with a local `compose.yaml`)
  or `sqlite` (aiosqlite 0.22.1, no service to run).
- Four tests through the ASGI transport, no network and no database: `/health`
  answers without a token, a protected route refuses an anonymous caller,
  refuses a token this service did not issue, and accepts one it did. The
  forged-token test is the one that matters — it fails if verification is ever
  reduced to decoding.
- Multi-stage Dockerfile with a non-root runtime stage, `.dockerignore`, and a
  container check that reads `/health` back on a port the operating system
  picks.
- CI workflow with `actions/checkout` and `actions/setup-python` pinned to
  commit SHAs, and read-only workflow permissions.

Verified on Windows with Python 3.14.7 and Docker 29.7.2: four tests with no
warnings, the image built, and the running container answering `/health`.
