# Changelog — django-web-app

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-24

First version.

A server-rendered Django 6.1.1 application with a custom user model, login and
logout through Django's own views, default-deny authentication through
`LoginRequiredMiddleware`, settings split into `base`, `local`, `test` and
`production`, and a CI workflow.

**Generated** by a tool from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where it ranked first: `django` 9.6M downloads a week on PyPI, 12.6% of
Stack Overflow respondents, and `web` the project type with the widest gap in
the catalog. Its recipe runs in CI like every other and nobody has built on it
yet, so it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). The
architecture and security review is
[docs/reviews/django-web-app/2026-09-24.md](../../docs/reviews/django-web-app/2026-09-24.md).

- Versions read from PyPI and Docker Hub on 2026-09-24: Django 6.1.1 (the
  current feature release; 5.2 LTS is out of mainstream support),
  `dj-database-url` 3.1.2, `psycopg[binary]` 3.3.6, `postgres:18.6-alpine`.
- `database` option: `postgres` (a local `compose.yaml` on a loopback port
  Docker chooses, and a Postgres service in CI) or `sqlite` (no server).
- Production refuses to start without `DJANGO_SECRET_KEY`,
  `DJANGO_ALLOWED_HOSTS` or `DATABASE_URL`, and refuses the local development
  key or any key shorter than Django's own deploy check accepts. It is proved
  twice: by tests that import the settings in a fresh interpreter, and by a
  recipe step that runs `manage.py check` with the development key and expects
  it to fail.
- `manage.py check --deploy --fail-level WARNING` passes against the
  production settings. The only silenced check is `security.W021` (HSTS
  preload), with the reason beside it.
- A Content Security Policy through Django 6's built-in middleware, with
  per-request nonces so the admin keeps working.
- From the architecture review, before the pull request opened:
  - Production refuses any key containing `not-a-real-secret`. The first draft
    ran the deploy check with a long placeholder, and a placeholder long
    enough to pass that check was also long enough for production to accept —
    a published key that signs sessions for anyone who has read the recipe.
    The recipe and the CI workflow now generate a key for the run.
  - HSTS defaults to one year rather than one hour (ASVS 5.0 3.4.1 asks for at
    least a year).
  - Production names its cookies `__Host-sessionid` and `__Host-csrftoken`
    (ASVS 5.0 3.3.1).
  - The route check reads each view's `@login_not_required` declaration, so
    routes with parameters are covered; the first draft only requested routes
    it could reverse without arguments.
- Console logging, because Django's default sends request errors nowhere when
  `DEBUG` is off and `ADMINS` is empty.
- 21 tests, among them one that reads every view's `@login_not_required`
  declaration, routes with parameters included, and fails unless the opted-out
  set is exactly the public list — the check that keeps default-deny from
  eroding one decorator at a time. A second requests every named route
  anonymously, which is what fails if the middleware itself is removed.

Three things came out of running it rather than describing it.

- **Test logging has to be quieted on the handler.** Setting the root logger
  to `ERROR` in the test settings left Django's request warnings in the test
  output, because records propagated from a named logger are filtered by the
  handler's level, not the parent logger's.
- **The first Postgres start can take minutes.** On a busy disk the cluster
  initialised in seconds and then spent minutes flushing itself to disk, and
  `docker compose up --wait` reported the container unhealthy — twice, the
  second time with a five-minute grace period. The local `compose.yaml` now
  initialises with `--no-sync`, which risks only that throwaway database and
  only on a host crash, and the health check keeps a `start_period`.
- **A Unix-socket health check lies during initialisation.** Once the start
  was fast, `migrate` failed with "the database system is shutting down": the
  image initialises through a temporary server on the socket only, then stops
  it, and `pg_isready` over the socket had already reported healthy. The check
  now goes over TCP to `127.0.0.1`, which only the final server answers — in
  the local `compose.yaml` and in the generated CI service alike.

Run on Windows with Python 3.14.7 and Docker 29.7.2 through
`forgeprint test-setup`, under both options; CI runs it on Linux with Python 3.13.

### Planned

- Login throttling, sign-up and password reset: each needs a decision this
  blueprint does not make (see `overview.md`).
- A production WSGI server and static file serving, with a check that runs the
  application under them.
