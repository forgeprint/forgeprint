# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

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
