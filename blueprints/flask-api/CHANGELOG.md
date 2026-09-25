# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-25

First release. Drafted by a tool from the 2026-09-24 catalog research
(`provenance: generated`, decision D13 of the expansion plan: a different stack
is a different triple, even though the project type and requirements match
`fastapi-service`). CI-tested, not manually verified.

- Flask 3.1.3, Flask-SQLAlchemy 3.1.1, Flask-Migrate 4.1.0, SQLAlchemy
  2.0.54, Alembic 1.20.0, psycopg 3.3.6, pydantic 2.13.5, PyJWT 2.15.0 and
  gunicorn 26.2.0; pytest 9.1.1 and ruff 0.16.9 for development. Every version
  was read from PyPI on 2026-09-25 and is pinned with `==`.
- SQLAlchemy stays on 2.0: 2.1.0 was published on 2026-09-24 and
  Flask-SQLAlchemy's latest release predates it.
- Images: `python:3.13.15-slim` and `postgres:18.6-alpine`, both read from
  Docker Hub on 2026-09-25.
- An application factory and blueprints, with nothing created at import time.
  Configuration from the environment in one place; unset `APP_ENV` is
  production, and production refuses a missing, placeholder or short
  `JWT_SECRET`. The recipe proves the refusal against the built image: gunicorn
  exits instead of serving.
- Token verification in one module, registered as `before_request` on each
  blueprint that serves a caller's data, with a pinned algorithm, an audience
  and required `exp`, `sub` and `aud`. Every notes query is scoped to the
  caller; another caller's note is 404.
- pydantic v2 at the boundary, and every error — 400, 401, 404, 405, 413, 415,
  422 and 500 — as an RFC 9457 problem document from one module.
- Forty-two tests against Postgres: every non-public route refuses an
  anonymous caller; forged, foreign-audience, expired, non-expiring and
  unsigned tokens are refused, and each refusal is logged with its reason and
  without the token; one caller cannot read, list or delete another's notes;
  the owner cannot be set from the body; every response is `nosniff` and
  `no-store`; the configuration refusals; readiness with and without a
  database; and migrations that run down and up and match the models.
- Reviewed under §5c before the pull request
  ([report](../../docs/reviews/flask-api/2026-09-25.md)): two findings fixed
  in the draft (the response headers and the refusal log), none `critical` or
  `high` open. Rate limiting is the open `medium`, declared in `overview.md`.
- The recipe formats the code with ruff before linting it. Forgeprint's option
  resolver folds runs of blank lines into one, including inside fenced code, so
  the files arrive with single blank lines between top-level definitions; the
  format step restores what ruff and the generated CI expect.
- Verified with `forgeprint test-setup` on Windows 11 (Git Bash, Python 3.14.7,
  Docker Desktop): 53 steps, including building the image, applying the
  migrations from it, and reading a note as its owner (200), as another caller
  (404) and anonymously (401) through gunicorn.

### Planned

- Rate limiting, once there is a policy to encode (OWASP API4:2023).
- Verification against an identity provider's JWKS (RS256, issuer check) as
  the path from shared-secret tokens to real ones.
