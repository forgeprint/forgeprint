# Django Web App — agent context

A server-rendered Django 6.1 application with its own user model, login and
logout through Django's views, and settings that differ per environment. Read
this before changing anything under `config/`, `accounts/` or `pages/`.

## The shape

```
manage.py                     local settings by default, test settings for `manage.py test`
config/settings/base.py       everything shared; DATABASE_URL is required here
config/settings/local.py      DEBUG on, a labelled development key, console email
config/settings/test.py       fast hasher, quiet logging, a test-only key
config/settings/production.py every deployment value from the environment, refused if missing
config/urls.py                every route, in one list
accounts/models.py            User(AbstractUser), empty, present from migration 0001
pages/views.py                the views; public ones say so with @login_not_required
templates/                    base.html, registration/login.html, pages/*.html
tests/                        test_auth.py, test_settings.py, test_migrations.py
```

## Rules that are not style preferences

**Every view needs a signed-in user unless it opts out.**
`LoginRequiredMiddleware` is in `MIDDLEWARE`, so a new view is protected
without a decorator. A public view carries `@login_not_required` **and** its
URL name goes into `PUBLIC` in `tests/test_auth.py`, in the same change.
Two tests turn that convention into a check:
`test_only_the_public_list_opts_out_of_the_login_requirement` reads every
view's declaration, routes with parameters included, and fails when the set of
opted-out views is not exactly `PUBLIC`; and
`test_every_route_outside_the_public_list_needs_a_login` requests every named
route without parameters anonymously, which fails if the middleware itself is
removed. Do not remove the middleware to make a view work — add the
decorator, and the name to the list.

**The user model is `accounts.User`.** Refer to it as `settings.AUTH_USER_MODEL`
in a `ForeignKey` and as `get_user_model()` in code, never as
`django.contrib.auth.models.User`, which is not installed as a model here.
Add profile fields to `accounts.User` itself as an ordinary migration. Never
swap `AUTH_USER_MODEL` to another model: once tables reference users, there is
no supported path.

**Configuration comes from the environment, and production refuses to guess.**
`config/settings/production.py` reads `DJANGO_SECRET_KEY`,
`DJANGO_ALLOWED_HOSTS` and `DATABASE_URL` and raises `ImproperlyConfigured`
while the settings are imported when one is missing, or when the key is the
local development value or weaker than Django's own deploy check accepts. That
refusal is tested in `tests/test_settings.py`. Never give one of those a
default in `production.py`, and never read `os.environ` outside
`config/settings/`.

**`DATABASE_URL` has no default anywhere.** A default that points at a
database points at the wrong one somewhere. Local development exports it; the
tests take it from the environment like everything else.

**Logout is a POST.** Django 5 removed logout by GET, and the template's
logout control is a form with `{% csrf_token %}`. A link to `logout` does not
work, and making it work reopens cross-site logout.

**Every form that posts carries `{% csrf_token %}`.** Do not add
`@csrf_exempt` to a view that a browser posts to. An endpoint that a machine
posts to is a different kind of endpoint and belongs somewhere with its own
authentication.

**No inline scripts or styles without the nonce.** `SECURE_CSP` allows this
origin and the per-request nonce. A `<script>` needs `{% csp_nonce_attr %}`
and a `style=""` attribute is blocked outright; put styles in a static file.
Loosening the policy with `'unsafe-inline'` removes most of what it protects.

**Migrations are generated and committed, never hand-edited.** Change a model,
run `python manage.py makemigrations`, read the file it wrote, commit both.
`test_every_model_change_has_a_migration` fails when a model changed and its
migration is missing, which is the change that reaches production as a
missing column.

## Commands

| Command                                                                                                  | What it does                                         |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `python manage.py runserver`                                                                             | The development server, with `config.settings.local` |
| `python manage.py test`                                                                                  | Every test, with `config.settings.test`              |
| `python manage.py makemigrations`                                                                        | Writes a migration for a model change                |
| `python manage.py migrate`                                                                               | Applies migrations to `DATABASE_URL`                 |
| `python manage.py createsuperuser`                                                                       | The first account; the admin is at `/admin/`         |
| `DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy --fail-level WARNING` | Django's deployment checklist, as CI runs it         |

Under the `postgres` option, `docker compose up -d --wait` starts the local
database on a port Docker chooses; `docker compose port db 5432` says which.

## Configuration

| Variable                         | Where                | What it is                                                                             |
| -------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | every environment    | `postgres://user:password@host:port/name` or `sqlite:///db.sqlite3`                    |
| `DJANGO_SETTINGS_MODULE`         | production           | `config.settings.production`. `wsgi.py` sets no default, so a server that forgot fails |
| `DJANGO_SECRET_KEY`              | production           | At least 50 characters, from `get_random_secret_key()`. The local value is refused     |
| `DJANGO_ALLOWED_HOSTS`           | production           | Comma-separated host names                                                             |
| `DJANGO_CSRF_TRUSTED_ORIGINS`    | production, optional | Comma-separated `https://` origins, when a form is posted from another origin          |
| `DJANGO_SECURE_HSTS_SECONDS`     | production, optional | `31536000` (one year) by default. Lower it for a first rollout, then raise it back     |
| `DJANGO_TRUST_X_FORWARDED_PROTO` | production, optional | `1` only behind a proxy that terminates TLS and overwrites `X-Forwarded-Proto`         |

## Adding a page

1. Write the view in `pages/views.py` (or a new app once the site has a
   second concern). It is protected already.
2. Add the route to `config/urls.py` with a `name`.
3. Put the template under `templates/pages/`, extending `base.html`.
4. Test it through `self.client`, not by calling the function: the middleware,
   the redirect and the template only exist on the round trip.
5. If it must be public: `@login_not_required` on the view and its name in
   `PUBLIC` in `tests/test_auth.py`. Both, or the route-walk test fails.

## Adding a model

1. Define it in the app it belongs to; a user reference is
   `models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=...)`.
2. `python manage.py makemigrations`, read the migration, commit it.
3. Anything that reads another user's object filters by the owner in the
   query, not after it: `Thing.objects.filter(owner=request.user)`. Being
   signed in is not the same as being allowed to see a row.

## What is not here

No sign-up, no password reset, no email delivery, no login throttling, no
production WSGI server, no static file serving in production, no container
image. `overview.md` says which of those are deliberate and what to add.
