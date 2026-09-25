# Flask API — agent context

A Flask 3.1 JSON API built from an application factory and blueprints, with
Flask-SQLAlchemy and Flask-Migrate on Postgres, pydantic at the boundary and
gunicorn in the container. Read this before changing anything under `app/`.

## The shape

```
app/__init__.py     create_app(config): the only place an app is built
app/config.py       Config.from_environ: the only code that reads os.environ
app/extensions.py   db and migrate, created unbound; imported, never re-created
app/models.py       SQLAlchemy models (db.Model, Mapped[...] columns)
app/schemas.py      pydantic models for what crosses the boundary
app/validation.py   from_body / from_query: request data becomes a model here
app/errors.py       the three error handlers; every error is RFC 9457
app/auth.py         the only module that reads Authorization or decodes a token
app/health.py       /health and /ready, the only public routes
app/notes.py        the notes blueprint: the pattern for every resource
migrations/         Flask-Migrate (Alembic); versions/ is reviewed, not formatted
scripts/dev_token.py  signs a local token; not in the image
tests/              pytest against a real Postgres named by TEST_DATABASE_URL
```

## Rules that are not style preferences

**Nothing is created at import time.** No `app = Flask(...)` at module level,
no engine, no connection. `create_app` builds everything, and the tests call it
with a `Config` of their own. A module-level app is the one the tests cannot
reconfigure, so it ends up pointing at whatever database the environment had.

**Extensions come from `app/extensions.py`.** A model or blueprint imports
`db` from there, never from `app`. Importing the package from inside it is the
circular import Flask projects hit first, and the usual "fix" — importing
inside a function — hides it until the order changes.

**A blueprint that serves a caller's data registers `authenticate` as its
`before_request`.** That is the whole authentication story: a route is
protected by being in the blueprint. Do not add a public route to such a
blueprint; make a new blueprint without the hook, and add its endpoints to
`PUBLIC` in `tests/test_auth.py` in the same change. That test builds a URL for
every rule in `app.url_map` and fails when any non-listed one answers an
anonymous request.

**`jwt.decode` is called in `app/auth.py` only, with `algorithms=`, an
audience and `require: [exp, sub, aud]`.** Without a pinned algorithm list a
token can choose `none`; without an audience, a token for another service works
here; without `exp`, a leaked token works forever. The tests forge each of
these and expect 401.

**Every query for a caller's rows starts from `owned()`.** `db.session.get(Note,
id)` loads by id alone and is how one caller reads another's note (OWASP
API1:2023). A row that is not the caller's is 404, the same as a row that does
not exist. `tests/test_notes.py` reads, lists and deletes across callers; a new
resource copies those three tests.

**The owner comes from the token, never from the body.** `NoteIn` has
`extra="forbid"`, so a body naming `owner` is 422, not quietly ignored. Do not
relax that to `ignore`: an ignored field is one a future change starts reading.

**Request data is read through `from_body` and `from_query`.** No route
touches `request.json`, `request.get_json()` or `request.args` directly. They
return a validated pydantic model or end the request with a 422 problem
document that points at the field.

**Routes raise; `app/errors.py` answers.** `abort(404)`, an `InvalidRequest`,
or an exception. A route never builds an error body, and the handler for
`Exception` logs the traceback and tells the caller nothing about it, because a
message can carry a host name, a query or a credential (OWASP A10:2025).

**`/health` touches nothing; `/ready` asks the database.** The container's
`HEALTHCHECK` uses `/health`, so a slow database does not get a working process
restarted. A load balancer reads `/ready`.

**Schema changes are migrations.** Change `app/models.py`, run
`flask --app app db migrate -m "..."`, read the generated file — autogenerate
misses renames and server defaults — then `flask --app app db upgrade`.
`tests/test_migrations.py` fails when a model changed and no migration did.
The session fixture runs every downgrade and upgrade on the test database, so a
migration that cannot be reversed fails there first.

**Configuration goes through `Config`.** A new setting is a field on `Config`,
read in `from_environ`, and copied into `app.config` in `create_app`. Unset
`APP_ENV` is production, and production refuses a missing, placeholder or
short `JWT_SECRET` before gunicorn serves anything.

## Adding a resource

1. The model in `app/models.py` with an `owner` column, then
   `flask --app app db migrate -m "create <things>"` and read the file.
2. `<Thing>In` (with `extra="forbid"`) and `<Thing>Out` in `app/schemas.py`.
3. `app/<things>.py`: a `Blueprint` with `bp.before_request(authenticate)` and
   an `owned()` that filters on `caller()`.
4. `app.register_blueprint(<things>.bp)` in `create_app`.
5. Tests through `client`: create, read your own, and the three cross-caller
   tests. The anonymous-route test covers the new URLs by itself.

## Commands

| What                    | Command                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| Database for local work | `docker compose up -d --wait`                                            |
| Run locally             | `APP_ENV=development DATABASE_URL=... flask --app app run --debug`       |
| Tests                   | `TEST_DATABASE_URL=... python -m pytest` (the database is emptied)       |
| Lint and format         | `ruff check .` and `ruff format .`                                       |
| New migration           | `flask --app app db migrate -m "..."`, then `flask --app app db upgrade` |
| A token to call it      | `python -m scripts.dev_token alice`                                      |
| The image, as deployed  | `JWT_SECRET=... docker compose --profile image up -d --wait`             |

## Configuration

| Variable            | What it is                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| `APP_ENV`           | `development`, `test` or `production`. Unset is production                 |
| `DATABASE_URL`      | `postgresql+psycopg://...`. Required everywhere, no default                |
| `JWT_SECRET`        | HS256 key, at least 32 bytes. Required in production; placeholders refused |
| `JWT_AUDIENCE`      | `api` unless set; a token for another audience is 401                      |
| `WEB_CONCURRENCY`   | gunicorn workers in the image, 2 by default                                |
| `TEST_DATABASE_URL` | Tests only. A database the tests downgrade to nothing and rebuild          |

## What is not here

No token issuing, no users or passwords, no rate limiting, no CORS, no
OpenAPI document, no async views. `overview.md` says why for each.
