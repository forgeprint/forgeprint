# Django Web App

A server-rendered Django 6.1 application: HTML from templates, sessions and
cookies, a custom user model from the first migration, login and logout
through Django's own views, and a dashboard nobody reaches without signing in.
Settings are split by environment, and the production settings refuse to start
without a real secret key. It is the Python answer for a web application in
the way `fastapi-service` is the Python answer for a JSON API.

## What you get

- **Django 6.1.1**, `dj-database-url` 3.1.2, and under `postgres`
  `psycopg[binary]` 3.3.6. Every version pinned with `==`.
- **Default-deny authentication.** `LoginRequiredMiddleware` protects every
  view that does not opt out with `@login_not_required`. One test fails when
  the set of opted-out views differs from the public list written in the
  tests; another requests every named route anonymously and fails on one that
  answers.
- **`accounts.User`**, an empty subclass of `AbstractUser`, registered in the
  admin and in place before the first migration.
- **Settings in four modules**: `base`, `local`, `test`, `production`.
  `DATABASE_URL` is required everywhere; production also requires
  `DJANGO_SECRET_KEY` and `DJANGO_ALLOWED_HOSTS`, and refuses the local key,
  any placeholder the project publishes, or any key Django's deploy check
  would call weak. The deploy check in the recipe and in CI generates a key
  for the run instead of reading one from a file.
- **Production hardening** that `manage.py check --deploy --fail-level WARNING`
  passes: HTTPS redirect, `Secure` cookies with `__Host-` names, one-year HSTS,
  a Content Security Policy using Django 6's built-in middleware with
  per-request nonces, and console logging so a failed request is visible when
  `DEBUG` is off.
- **21 tests** through Django's test client and runner, no extra test
  dependency: an anonymous request to the dashboard goes to login, and to the
  admin goes to the admin's login, only the listed views are public, a signed-in
  user sees it, the right password signs in and the wrong one does not, login
  never redirects to another site, logout refuses GET, a form post without a
  CSRF token is refused, pages carry the policy, production refuses a missing,
  local, placeholder or weak key and a missing host list, and every model
  change has a migration.
- **A CI workflow** with actions pinned to commit SHAs, read-only permissions,
  the migration check, the tests and the deploy check.

## Options

| Option     | Value      | What it changes                                                                                                          |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `database` | `postgres` | Adds `psycopg[binary]`, a `compose.yaml` with `postgres:18.6-alpine` on a loopback port Docker chooses, and a CI service |
| `database` | `sqlite`   | No database server and no Docker. `DATABASE_URL=sqlite:///db.sqlite3`                                                    |

The code is identical under both; only the driver, the local database and the
CI workflow differ.

## What it fits

- A web application whose pages are rendered on the server: an internal tool,
  a back office, a content-heavy site with accounts, a product whose first
  version is forms and tables.
- A Python team that wants the admin, the ORM, migrations and authentication
  from one framework instead of assembling them.
- A project that will run on a Linux host or a platform that runs a WSGI
  application and supplies Postgres.

## What it is NOT for

- **A JSON API for other programs.** There is no API framework and no token
  authentication. Use `fastapi-service`, which verifies bearer tokens and ships
  a container.
- **A single-page application.** The pages are server-rendered and there is no
  JavaScript build. A React front end on a separate API is
  `nextjs-fullstack-app` or an API blueprint plus a front end.
- **Sign-up, password reset or email verification.** Only login and logout are
  wired. Password reset needs mail delivery, and sign-up needs a decision about
  who may join; both are choices this blueprint does not make for you.
- **Login throttling.** Nothing limits how often a password can be tried, on
  the site's login or the admin's (OWASP ASVS 5.0 6.3.1). Put a rate limit in
  the reverse proxy, or add a lockout package, before the login page is on the
  internet. Logins are not logged either (ASVS 5.0 16.3.1); add that in the
  same change, because the throttle and the log are read together.
- **Deployment.** No WSGI server is installed and nothing serves static files
  when `DEBUG` is off, so the admin's styles need `collectstatic` and a web
  server or WhiteNoise. There is no container image. `python-background-worker`
  and `fastapi-service` show the container side in this catalog.
- **Multi-tenancy.** One user table, no tenant boundary.
  `dotnet-multitenant-saas-api` shows what that costs to do properly.
- **Background work.** Anything slow in a request blocks a worker; that is
  what `python-background-worker` is for.

## Trade-offs made on your behalf

- **Django 6.1 rather than the 5.2 LTS.** 6.1 is the current feature release,
  supported until December 2027; 5.2 LTS is supported until April 2028 but is
  already out of mainstream support, and it does not have the built-in CSP
  middleware this blueprint uses (new in 6.0). A project starting on 6.1 moves
  to the 6.2 LTS, due April 2027, with one feature upgrade.
- **`LoginRequiredMiddleware` instead of `@login_required` on each view.**
  Forgetting a decorator makes a page public; forgetting
  `@login_not_required` makes a page ask for a login, which somebody notices
  in a minute. What remains is a decorator added carelessly, and the test that
  compares opted-out views with the public list catches that.
- **An empty custom user model.** It costs one small migration now; the
  alternative is a migration Django has no supported path for, later.
- **Django's test runner, not pytest.** No extra dependency, and the test
  client, transactions and database setup are Django's own. Switching to
  `pytest-django` later changes nothing in the tests.
- **HSTS at one year, subdomains included, not preloaded.** One year is the
  minimum OWASP ASVS 5.0 (3.4.1) asks for. It also locks browsers out of any
  plain-HTTP subdomain for that year, so a first rollout sets
  `DJANGO_SECURE_HSTS_SECONDS` lower and raises it once every host serves
  HTTPS. Preloading takes months to undo, so the preload check
  (`security.W021`) is silenced in `production.py`, with that reason next to it.
- **`__Host-` cookie names in production.** A browser then refuses the session
  and CSRF cookies unless they are `Secure`, on `/`, and bound to this exact
  host, so a sibling subdomain cannot plant one (ASVS 5.0 3.3.1). Local
  development keeps Django's names, because it runs over plain HTTP.
- **The proxy header is opt-in.** Behind a TLS-terminating proxy the HTTPS
  redirect loops until `DJANGO_TRUST_X_FORWARDED_PROTO=1` is set. Trusting the
  header by default would let a client claim HTTPS when no proxy is present.
- **A random local database port.** `5432` is usually taken; the recipe asks
  Docker which port it chose, and the README says to do the same.

## Cost of adoption

About ten minutes with Python 3.13 or newer, and Docker under `postgres`. The
first real decisions are ahead of you and deliberately so: how accounts are
created, how mail is sent, which WSGI server runs it, and where static files
are served from.
