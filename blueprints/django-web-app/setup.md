# Setup

Creates a server-rendered Django 6.1 application: a custom user model from the
first migration, login and logout with Django's own views, a page every
anonymous visitor is refused, settings split by environment so that production
refuses to start without a real secret, tests that prove each of those claims,
and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires Python 3.13 or newer. Under the `postgres` option it also requires
Docker, which runs the local database.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

<!-- if options.database == postgres -->

3. Create `requirements.txt` with:

   ```text
   django==6.1.1
   dj-database-url==3.1.2
   psycopg[binary]==3.3.6
   ```

   Verify: `test -f requirements.txt`

<!-- endif -->

<!-- if options.database == sqlite -->

3. Create `requirements.txt` with:

   ```text
   django==6.1.1
   dj-database-url==3.1.2
   ```

   Verify: `test -f requirements.txt`

<!-- endif -->

4. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements.txt`
   Verify: `"$(cat python.path)" -c "import django; assert django.get_version() == '6.1.1'"`

5. Create `manage.py` with:

   ```python
   #!/usr/bin/env python
   """Django's command-line entry point.

   Local settings unless DJANGO_SETTINGS_MODULE says otherwise, and test
   settings for `manage.py test`, so that neither the tests nor a developer
   can reach production settings by accident. Production sets the variable
   explicitly; nothing here guesses that it is running there.
   """

   import os
   import sys


   def main() -> None:
       default = "config.settings.test" if sys.argv[1:2] == ["test"] else "config.settings.local"
       os.environ.setdefault("DJANGO_SETTINGS_MODULE", default)
       from django.core.management import execute_from_command_line

       execute_from_command_line(sys.argv)


   if __name__ == "__main__":
       main()
   ```

   Verify: `test -f manage.py`

6. Create `config/__init__.py` with:

   ```python
   """Project configuration: settings, URLs and the WSGI entry point."""
   ```

   Verify: `test -f config/__init__.py`

7. Create `config/settings/__init__.py` with:

   ```python
   """One module per environment. Each imports `base` and adds what differs."""
   ```

   Verify: `test -f config/settings/__init__.py`

8. Create `config/settings/base.py` with:

   ```python
   """Settings every environment shares.

   Nothing in this file is a secret and nothing in it differs between
   environments. `local.py`, `test.py` and `production.py` import it and add
   what does. Which one runs is DJANGO_SETTINGS_MODULE.
   """

   import os
   from pathlib import Path

   import dj_database_url
   from django.core.exceptions import ImproperlyConfigured
   from django.utils.csp import CSP

   BASE_DIR = Path(__file__).resolve().parent.parent.parent

   # The key local development falls back to. Named here so production.py can
   # refuse it by name: a development value that reaches production is the
   # failure this constant exists to make impossible.
   LOCAL_ONLY_SECRET_KEY = "local-development-only-not-a-real-secret"


   def env(name: str) -> str:
       """A required environment variable, or a refusal to start.

       Read while the settings module is imported, so a missing value stops
       every command, the server included, before anything is served.
       """
       value = os.environ.get(name, "").strip()
       if not value:
           raise ImproperlyConfigured(f"{name} is not set.")
       return value


   INSTALLED_APPS = [
       "django.contrib.admin",
       "django.contrib.auth",
       "django.contrib.contenttypes",
       "django.contrib.sessions",
       "django.contrib.messages",
       "django.contrib.staticfiles",
       "accounts",
       "pages",
   ]

   MIDDLEWARE = [
       "django.middleware.security.SecurityMiddleware",
       "django.middleware.csp.ContentSecurityPolicyMiddleware",
       "django.contrib.sessions.middleware.SessionMiddleware",
       "django.middleware.common.CommonMiddleware",
       "django.middleware.csrf.CsrfViewMiddleware",
       "django.contrib.auth.middleware.AuthenticationMiddleware",
       # Every view requires a signed-in user unless it opts out with
       # @login_not_required. Default-deny: a view somebody forgets to
       # protect is protected anyway.
       "django.contrib.auth.middleware.LoginRequiredMiddleware",
       "django.contrib.messages.middleware.MessageMiddleware",
       "django.middleware.clickjacking.XFrameOptionsMiddleware",
   ]

   ROOT_URLCONF = "config.urls"
   WSGI_APPLICATION = "config.wsgi.application"

   TEMPLATES = [
       {
           "BACKEND": "django.template.backends.django.DjangoTemplates",
           "DIRS": [BASE_DIR / "templates"],
           "APP_DIRS": True,
           "OPTIONS": {
               "context_processors": [
                   "django.template.context_processors.request",
                   "django.contrib.auth.context_processors.auth",
                   "django.contrib.messages.context_processors.messages",
                   "django.template.context_processors.csp",
               ],
           },
       },
   ]

   # One variable, no default. A default that points at a database is a
   # default that points at the wrong one somewhere.
   DATABASES = {
       "default": dj_database_url.parse(
           env("DATABASE_URL"),
           conn_max_age=60,
           conn_health_checks=True,
       ),
   }

   # The project's own user model, from the first migration. Changing
   # AUTH_USER_MODEL after tables exist has no supported path.
   AUTH_USER_MODEL = "accounts.User"

   LOGIN_URL = "login"
   LOGIN_REDIRECT_URL = "dashboard"
   LOGOUT_REDIRECT_URL = "home"

   AUTH_PASSWORD_VALIDATORS = [
       {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
       {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
       {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
       {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
   ]

   # Scripts and styles from this origin, or carrying the per-request nonce
   # the admin's templates already emit. Nothing inline without one.
   SECURE_CSP = {
       "default-src": [CSP.SELF],
       "script-src": [CSP.SELF, CSP.NONCE],
       "style-src": [CSP.SELF, CSP.NONCE],
       "object-src": [CSP.NONE],
       "base-uri": [CSP.NONE],
       "frame-ancestors": [CSP.NONE],
       "form-action": [CSP.SELF],
   }

   LANGUAGE_CODE = "en-us"
   TIME_ZONE = "UTC"
   USE_I18N = True
   USE_TZ = True

   STATIC_URL = "static/"
   STATIC_ROOT = BASE_DIR / "staticfiles"

   DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

   # Everything to the console, where a container or a process manager
   # collects it. Django's own default sends request errors only to
   # ADMINS by email when DEBUG is off, which with no ADMINS is nowhere.
   LOGGING = {
       "version": 1,
       "disable_existing_loggers": False,
       "handlers": {"console": {"class": "logging.StreamHandler"}},
       "root": {"handlers": ["console"], "level": "INFO"},
   }
   ```

   Verify: `test -f config/settings/base.py`

9. Create `config/settings/local.py` with:

   ```python
   """Local development. Never deployed."""

   import os

   from .base import *  # noqa: F403
   from .base import LOCAL_ONLY_SECRET_KEY

   DEBUG = True

   SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", LOCAL_ONLY_SECRET_KEY)

   ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]

   # Password reset and any other mail is printed, not sent.
   EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
   ```

   Verify: `test -f config/settings/local.py`

10. Create `config/settings/test.py` with:

    ```python
    """The test run. `manage.py test` selects it unless told otherwise."""

    from .base import *  # noqa: F403
    from .base import LOGGING

    DEBUG = False

    SECRET_KEY = "not-a-real-secret-only-for-tests"

    ALLOWED_HOSTS = ["testserver"]

    # A deliberately fast hasher: the tests create users, and the real one is
    # slow on purpose. Never outside this file.
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

    # A refused request logs a warning, and the tests make several on purpose.
    # The level goes on the handler: records from Django's own loggers
    # propagate past the root logger's level and stop only at a handler's.
    LOGGING = {
        **LOGGING,
        "handlers": {"console": {"class": "logging.StreamHandler", "level": "ERROR"}},
    }
    ```

    Verify: `test -f config/settings/test.py`

11. Create `config/settings/production.py` with:

    ```python
    """Production. Every value that differs per deployment comes from the
    environment, and a missing or development value stops the process.
    """

    import os

    from django.core.exceptions import ImproperlyConfigured

    from .base import *  # noqa: F403
    from .base import LOCAL_ONLY_SECRET_KEY, env

    DEBUG = False

    SECRET_KEY = env("DJANGO_SECRET_KEY")
    if (
        SECRET_KEY == LOCAL_ONLY_SECRET_KEY
        # Every placeholder in this project carries that phrase, and a
        # placeholder is published: whoever reads it can sign sessions.
        or "not-a-real-secret" in SECRET_KEY
        or SECRET_KEY.startswith("django-insecure-")
        or len(SECRET_KEY) < 50
        or len(set(SECRET_KEY)) < 5
    ):
        # The same bar as Django's own deploy check, as a refusal rather than
        # a warning somebody has to run a command to see.
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY is a development value or too weak. Generate one with: "
            "python -c 'from django.core.management.utils import get_random_secret_key; "
            "print(get_random_secret_key())'"
        )

    ALLOWED_HOSTS = [host.strip() for host in env("DJANGO_ALLOWED_HOSTS").split(",") if host.strip()]
    CSRF_TRUSTED_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
        if origin.strip()
    ]

    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # The __Host- prefix makes a browser refuse the cookie unless it is Secure,
    # has Path=/ and names no Domain, so a sibling subdomain cannot plant one.
    SESSION_COOKIE_NAME = "__Host-sessionid"
    CSRF_COOKIE_NAME = "__Host-csrftoken"

    # One year, the minimum OWASP ASVS 5.0 asks for. A long max-age on a host
    # that still needs plain HTTP locks browsers out of it for that long, so
    # during a first rollout set DJANGO_SECURE_HSTS_SECONDS lower and raise it
    # once every host under the domain serves HTTPS.
    SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # Preloading is a request to browser vendors that takes months to undo, so
    # it is a decision for whoever owns the domain, not a default.
    SECURE_HSTS_PRELOAD = False
    SILENCED_SYSTEM_CHECKS = ["security.W021"]

    # Behind a proxy that terminates TLS, Django sees plain HTTP and the
    # redirect above loops. Trust the proxy's header only when told to: a
    # client can send the same header, and only a proxy that overwrites it
    # makes it true.
    if os.environ.get("DJANGO_TRUST_X_FORWARDED_PROTO") == "1":
        SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    ```

    Verify: `test -f config/settings/production.py`

12. Create `config/urls.py` with:

    ```python
    from django.contrib import admin
    from django.contrib.auth import views as auth_views
    from django.urls import path

    from pages import views

    urlpatterns = [
        path("", views.home, name="home"),
        path("dashboard/", views.dashboard, name="dashboard"),
        path(
            "accounts/login/",
            auth_views.LoginView.as_view(redirect_authenticated_user=True),
            name="login",
        ),
        path("accounts/logout/", auth_views.LogoutView.as_view(), name="logout"),
        path("admin/", admin.site.urls),
    ]
    ```

    Verify: `test -f config/urls.py`

13. Create `config/wsgi.py` with:

    ```python
    """The WSGI entry point a production server imports.

    No default settings module: the server's environment names it, so a
    deployment that forgot to fails instead of running local settings.
    """

    from django.core.wsgi import get_wsgi_application

    application = get_wsgi_application()
    ```

    Verify: `test -f config/wsgi.py`

14. Create `accounts/__init__.py` with:

    ```python
    """The user model and everything that belongs to it."""
    ```

    Verify: `test -f accounts/__init__.py`

15. Create `accounts/apps.py` with:

    ```python
    from django.apps import AppConfig


    class AccountsConfig(AppConfig):
        name = "accounts"
    ```

    Verify: `test -f accounts/apps.py`

16. Create `accounts/models.py` with:

    ```python
    from django.contrib.auth.models import AbstractUser


    class User(AbstractUser):
        """The project's user, present from the first migration.

        Empty on purpose. It exists so that adding a field later is an
        ordinary migration; replacing Django's built-in user after tables
        reference it is not.
        """
    ```

    Verify: `test -f accounts/models.py`

17. Create `accounts/admin.py` with:

    ```python
    from django.contrib import admin
    from django.contrib.auth.admin import UserAdmin

    from accounts.models import User

    admin.site.register(User, UserAdmin)
    ```

    Verify: `test -f accounts/admin.py`

18. Create `pages/__init__.py` with:

    ```python
    """The site's pages."""
    ```

    Verify: `test -f pages/__init__.py`

19. Create `pages/apps.py` with:

    ```python
    from django.apps import AppConfig


    class PagesConfig(AppConfig):
        name = "pages"
    ```

    Verify: `test -f pages/apps.py`

20. Create `pages/views.py` with:

    ```python
    from django.contrib.auth.decorators import login_not_required
    from django.http import HttpRequest, HttpResponse
    from django.shortcuts import render


    @login_not_required
    def home(request: HttpRequest) -> HttpResponse:
        """Public, because it says so here and because the tests list it."""
        return render(request, "pages/home.html")


    def dashboard(request: HttpRequest) -> HttpResponse:
        """Protected with no decorator: LoginRequiredMiddleware refuses an
        anonymous request to every view that has not opted out."""
        return render(request, "pages/dashboard.html")
    ```

    Verify: `test -f pages/views.py`

21. Create `templates/base.html` with:

    ```django
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{% block title %}App{% endblock %}</title>
      </head>
      <body>
        <header>
          <nav>
            <a href="{% url 'home' %}">Home</a>
            {% if user.is_authenticated %}
            <a href="{% url 'dashboard' %}">Dashboard</a>
            <form method="post" action="{% url 'logout' %}">
              {% csrf_token %}
              <button type="submit">Log out</button>
            </form>
            {% else %}
            <a href="{% url 'login' %}">Log in</a>
            {% endif %}
          </nav>
        </header>
        <main>{% block content %}{% endblock %}</main>
      </body>
    </html>
    ```

    Verify: `test -f templates/base.html`

22. Create `templates/registration/login.html` with:

    ```django
    {% extends "base.html" %}
    {% block title %}Log in{% endblock %}
    {% block content %}
    <h1>Log in</h1>
    <form method="post" action="{% url 'login' %}">
      {% csrf_token %}
      {{ form.as_div }}
      <input type="hidden" name="next" value="{{ next }}" />
      <button type="submit">Log in</button>
    </form>
    {% endblock %}
    ```

    Verify: `test -f templates/registration/login.html`

23. Create `templates/pages/home.html` with:

    ```django
    {% extends "base.html" %}
    {% block content %}
    <h1>Welcome</h1>
    <p>This page is public. The dashboard is not.</p>
    {% endblock %}
    ```

    Verify: `test -f templates/pages/home.html`

24. Create `templates/pages/dashboard.html` with:

    ```django
    {% extends "base.html" %}
    {% block title %}Dashboard{% endblock %}
    {% block content %}
    <h1>Dashboard</h1>
    <p>Signed in as {{ user.get_username }}.</p>
    {% endblock %}
    ```

    Verify: `test -f templates/pages/dashboard.html`

25. Create `tests/__init__.py` with:

    ```python
    """The project's tests. `manage.py test` finds every test*.py here."""
    ```

    Verify: `test -f tests/__init__.py`

26. Create `tests/test_auth.py` with:

    ```python
    from collections.abc import Iterator, Sequence
    from typing import Any

    from django.contrib.auth import get_user_model
    from django.test import Client, TestCase
    from django.urls import NoReverseMatch, URLResolver, get_resolver, reverse

    from accounts.models import User

    PASSWORD = "correct-horse-battery-staple-for-tests"

    # The views an anonymous visitor may reach, by URL name. Making a page
    # public means adding it here, on purpose, in the same change as
    # @login_not_required. The admin's own login page is Django's.
    PUBLIC = {"home", "login", "admin:login"}


    def declared_public(patterns: Sequence[Any], namespace: str = "") -> Iterator[str]:
        """The name of every view, parameters or not, that opted out of the
        login requirement. @login_not_required marks the view itself, so this
        reads the declaration rather than probing URLs it would have to guess."""
        for pattern in patterns:
            if isinstance(pattern, URLResolver):
                inner = f"{namespace}{pattern.namespace}:" if pattern.namespace else namespace
                yield from declared_public(pattern.url_patterns, inner)
            elif getattr(pattern.callback, "login_required", True) is False:
                yield f"{namespace}{pattern.name}"


    class AuthenticationTests(TestCase):
        @classmethod
        def setUpTestData(cls) -> None:
            cls.user = User.objects.create_user(username="ada", password=PASSWORD)

        def test_the_user_model_is_the_projects_own(self) -> None:
            self.assertIs(get_user_model(), User)
            self.assertEqual(User._meta.label, "accounts.User")

        def test_the_home_page_is_public(self) -> None:
            response = self.client.get(reverse("home"))
            self.assertEqual(response.status_code, 200)

        def test_an_anonymous_request_to_the_dashboard_is_sent_to_login(self) -> None:
            response = self.client.get(reverse("dashboard"))
            self.assertRedirects(
                response,
                f"{reverse('login')}?next={reverse('dashboard')}",
                fetch_redirect_response=False,
            )

        def test_only_the_public_list_opts_out_of_the_login_requirement(self) -> None:
            self.assertEqual(set(declared_public(get_resolver().url_patterns)), PUBLIC)

        def test_the_admin_sends_an_anonymous_visitor_to_its_login(self) -> None:
            response = self.client.get(reverse("admin:index"))
            self.assertRedirects(
                response,
                f"{reverse('admin:login')}?next={reverse('admin:index')}",
                fetch_redirect_response=False,
            )

        def test_every_route_outside_the_public_list_needs_a_login(self) -> None:
            names = sorted(name for name in get_resolver().reverse_dict if isinstance(name, str))
            # A loop over nothing asserts nothing; make sure it saw a route.
            self.assertIn("dashboard", names)
            for name in names:
                if name in PUBLIC:
                    continue
                try:
                    url = reverse(name)
                except NoReverseMatch:
                    continue
                with self.subTest(route=name):
                    response = self.client.get(url)
                    self.assertEqual(response.status_code, 302)
                    self.assertTrue(response["Location"].startswith(reverse("login")))

        def test_a_signed_in_user_sees_the_dashboard(self) -> None:
            self.client.force_login(self.user)
            response = self.client.get(reverse("dashboard"))
            self.assertContains(response, "Signed in as ada.")

        def test_the_right_password_leads_to_the_dashboard(self) -> None:
            response = self.client.post(
                reverse("login"), {"username": "ada", "password": PASSWORD}
            )
            self.assertRedirects(response, reverse("dashboard"))

        def test_a_wrong_password_does_not_sign_in(self) -> None:
            response = self.client.post(
                reverse("login"), {"username": "ada", "password": "not-the-password"}
            )
            self.assertEqual(response.status_code, 200)
            self.assertNotIn("_auth_user_id", self.client.session)

        def test_login_never_redirects_to_another_site(self) -> None:
            response = self.client.post(
                reverse("login"),
                {"username": "ada", "password": PASSWORD, "next": "https://example.com/"},
            )
            self.assertRedirects(response, reverse("dashboard"))

        def test_logout_needs_a_post(self) -> None:
            self.client.force_login(self.user)
            self.assertEqual(self.client.get(reverse("logout")).status_code, 405)
            response = self.client.post(reverse("logout"))
            self.assertRedirects(response, reverse("home"))
            self.assertNotIn("_auth_user_id", self.client.session)

        def test_a_form_post_without_a_csrf_token_is_refused(self) -> None:
            client = Client(enforce_csrf_checks=True)
            response = client.post(reverse("login"), {"username": "ada", "password": PASSWORD})
            self.assertEqual(response.status_code, 403)

        def test_pages_carry_a_content_security_policy(self) -> None:
            response = self.client.get(reverse("home"))
            self.assertIn("default-src 'self'", response["Content-Security-Policy"])
    ```

    Verify: `test -f tests/test_auth.py`

27. Create `tests/test_settings.py` with:

    ```python
    import os
    import subprocess
    import sys

    from django.conf import settings
    from django.core.management.utils import get_random_secret_key
    from django.test import SimpleTestCase

    from config.settings.base import LOCAL_ONLY_SECRET_KEY


    def start(settings_module: str, **variables: str) -> subprocess.CompletedProcess[str]:
        """Import a settings module in a fresh interpreter, the way a server
        would, with exactly the variables given and none from this process."""
        environment = {
            key: value
            for key, value in os.environ.items()
            if not key.startswith(("DJANGO_", "DATABASE_URL"))
        }
        environment.update({"DJANGO_SETTINGS_MODULE": settings_module, **variables})
        return subprocess.run(
            [
                sys.executable,
                "-c",
                "import django; django.setup(); from django.conf import settings; "
                "print(settings.DEBUG, settings.SESSION_COOKIE_SECURE, settings.SESSION_COOKIE_NAME)",
            ],
            cwd=settings.BASE_DIR,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )


    PRODUCTION = {"DATABASE_URL": "sqlite:///unused.sqlite3", "DJANGO_ALLOWED_HOSTS": "example.com"}


    class ProductionSettingsTests(SimpleTestCase):
        def test_production_refuses_to_start_without_a_secret_key(self) -> None:
            result = start("config.settings.production", **PRODUCTION)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("DJANGO_SECRET_KEY is not set", result.stderr)

        def test_production_refuses_the_local_development_key(self) -> None:
            result = start(
                "config.settings.production",
                DJANGO_SECRET_KEY=LOCAL_ONLY_SECRET_KEY,
                **PRODUCTION,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("development value or too weak", result.stderr)

        def test_production_refuses_a_published_placeholder(self) -> None:
            result = start(
                "config.settings.production",
                DJANGO_SECRET_KEY="not-a-real-secret-long-enough-to-pass-every-other-rule-0123456789",
                **PRODUCTION,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("development value or too weak", result.stderr)

        def test_production_refuses_a_short_key(self) -> None:
            result = start(
                "config.settings.production", DJANGO_SECRET_KEY="too-short", **PRODUCTION
            )
            self.assertNotEqual(result.returncode, 0)

        def test_production_refuses_to_start_without_allowed_hosts(self) -> None:
            result = start(
                "config.settings.production",
                DJANGO_SECRET_KEY=get_random_secret_key(),
                DATABASE_URL="sqlite:///unused.sqlite3",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("DJANGO_ALLOWED_HOSTS is not set", result.stderr)

        def test_no_environment_starts_without_a_database_url(self) -> None:
            result = start("config.settings.local")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("DATABASE_URL is not set", result.stderr)

        def test_production_starts_with_a_real_key_and_debug_off(self) -> None:
            result = start(
                "config.settings.production",
                DJANGO_SECRET_KEY=get_random_secret_key(),
                **PRODUCTION,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout.strip(), "False True __Host-sessionid")
    ```

    Verify: `test -f tests/test_settings.py`

28. Create `tests/test_migrations.py` with:

    ```python
    from io import StringIO

    from django.core.management import call_command
    from django.test import TestCase


    class MigrationTests(TestCase):
        def test_every_model_change_has_a_migration(self) -> None:
            """Fails when a model changed and nobody ran makemigrations: the
            change would otherwise reach production as a missing column."""
            call_command("makemigrations", "--check", "--dry-run", stdout=StringIO())
    ```

    Verify: `test -f tests/test_migrations.py`

29. Create `.gitignore` with:

    ```gitignore
    .venv/
    __pycache__/
    *.pyc
    db.sqlite3
    staticfiles/
    .env
    python.path
    db.url
    refused.log
    refused.code
    ```

    Verify: `test -f .gitignore`

<!-- if options.database == postgres -->

30. Create `compose.yaml` for the local database with:

    ```yaml
    # Local development only. Nothing here is a production configuration.
    services:
      db:
        image: postgres:18.6-alpine
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
          # The first start initialises the cluster and then flushes it to
          # disk, which can take minutes on a busy disk. Skipping that flush
          # risks only this throwaway database, and only on a host crash.
          POSTGRES_INITDB_ARGS: --no-sync
        # Loopback, and no fixed host port: 5432 is usually taken already, by
        # an installed Postgres or another project. Ask Docker which port it
        # chose with `docker compose port db 5432`.
        ports: ['127.0.0.1::5432']
        healthcheck:
          # Over TCP on purpose. While it initialises the cluster, the image
          # runs a temporary server on the Unix socket only, then stops it;
          # a socket check reports healthy during that window and the first
          # connection lands on a server that is shutting down.
          test: ['CMD-SHELL', 'pg_isready -h 127.0.0.1 -U app -d app']
          interval: 2s
          retries: 15
          # Failures while the cluster is first initialised do not count.
          start_period: 120s
    ```

    Verify: `docker compose config --quiet`

31. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          db:
            image: postgres:18.6-alpine
            env:
              POSTGRES_USER: app
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -h 127.0.0.1 -U app -d app"
              --health-interval 2s
              --health-retries 15
        env:
          DATABASE_URL: postgres://app:local-development-only@127.0.0.1:5432/app
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - run: pip install -r requirements.txt
          - run: python manage.py makemigrations --check --dry-run
          - run: python manage.py test
          # A key generated for this check alone: production.py refuses any
          # placeholder, because a published key signs sessions for anyone.
          - run: DJANGO_SECRET_KEY="$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" python manage.py check --deploy --fail-level WARNING
            env:
              DJANGO_SETTINGS_MODULE: config.settings.production
              DJANGO_ALLOWED_HOSTS: example.com
    ```

    Verify: `test -f .github/workflows/ci.yml`

<!-- endif -->

<!-- if options.database == sqlite -->

30. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        env:
          DATABASE_URL: sqlite:///db.sqlite3
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - run: pip install -r requirements.txt
          - run: python manage.py makemigrations --check --dry-run
          - run: python manage.py test
          # A key generated for this check alone: production.py refuses any
          # placeholder, because a published key signs sessions for anyone.
          - run: DJANGO_SECRET_KEY="$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" python manage.py check --deploy --fail-level WARNING
            env:
              DJANGO_SETTINGS_MODULE: config.settings.production
              DJANGO_ALLOWED_HOSTS: example.com
    ```

    Verify: `test -f .github/workflows/ci.yml`

<!-- endif -->

32. Create `README.md` with:

    ```markdown
    # app

    A server-rendered Django application.

    ## Run it

    Every settings module needs `DATABASE_URL`; none has a default. Export it,
    then `python manage.py migrate` and `python manage.py runserver`. With the
    Postgres in `compose.yaml`, start it with `docker compose up -d --wait` and
    build the URL from `docker compose port db 5432`.

    `python manage.py createsuperuser` makes the first account.

    ## Test it

    `python manage.py test` selects `config.settings.test` by itself.

    ## Deploy it

    Set `DJANGO_SETTINGS_MODULE=config.settings.production`,
    `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and `DATABASE_URL`. Production
    refuses to start without them, and refuses a development key. Run
    `python manage.py check --deploy` against the real environment before the
    first release.
    ```

    Verify: `test -f README.md`

<!-- if options.database == postgres -->

33. Remove a database container left behind by an earlier attempt, so this does not depend on a clean machine: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q db)"`

34. Start Postgres and wait until it accepts connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

35. Ask Docker which host port it chose, and write the database URL once so every step below uses the same one: `echo "postgres://app:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -q "^postgres://app:local-development-only@127.0.0.1:[0-9]*/app$" db.url`

<!-- endif -->

<!-- if options.database == sqlite -->

33. Write the database URL once so every step below uses the same one: `echo "sqlite:///db.sqlite3" > db.url`
    Verify: `grep -q "^sqlite:///" db.url`

<!-- endif -->

36. Generate the first migration, which creates the custom user table before anything can reference Django's built-in one: `DATABASE_URL="$(cat db.url)" "$(cat python.path)" manage.py makemigrations accounts`
    Verify: `test -f accounts/migrations/0001_initial.py`

37. Apply every migration: `DATABASE_URL="$(cat db.url)" "$(cat python.path)" manage.py migrate --no-input`
    Verify: `DATABASE_URL="$(cat db.url)" "$(cat python.path)" manage.py migrate --check`

38. Run the tests. They prove that an anonymous request to the dashboard is sent to login, that only the listed views opt out of the login requirement, that production refuses a missing, development, placeholder or weak secret key, and that models and migrations agree: `DATABASE_URL="$(cat db.url)" "$(cat python.path)" manage.py test --noinput`
    Verify: `DATABASE_URL="$(cat db.url)" "$(cat python.path)" manage.py test --noinput`

39. Run Django's deployment checklist against the production settings, with warnings treated as failures. The key is generated for this run and never written down, because production refuses any key that has been published, placeholders included: `DATABASE_URL="$(cat db.url)" DJANGO_SETTINGS_MODULE=config.settings.production DJANGO_SECRET_KEY="$("$(cat python.path)" -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" DJANGO_ALLOWED_HOSTS="example.com" "$(cat python.path)" manage.py check --deploy --fail-level WARNING`
    Verify: `DATABASE_URL="$(cat db.url)" DJANGO_SETTINGS_MODULE=config.settings.production DJANGO_SECRET_KEY="$("$(cat python.path)" -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" DJANGO_ALLOWED_HOSTS="example.com" "$(cat python.path)" manage.py check --deploy --fail-level WARNING`

40. Confirm the production settings refuse the development key the way a deployment would meet it, from the command line rather than from a test: `DATABASE_URL="$(cat db.url)" DJANGO_SETTINGS_MODULE=config.settings.production DJANGO_SECRET_KEY="local-development-only-not-a-real-secret" DJANGO_ALLOWED_HOSTS="example.com" "$(cat python.path)" manage.py check > refused.log 2>&1; echo "$?" > refused.code`
    Verify: `grep -qv '^0$' refused.code && grep -q "development value or too weak" refused.log`

<!-- if options.database == postgres -->

41. Stop the database: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q db)"`

<!-- endif -->

## After setup

- `python manage.py createsuperuser` makes the first account; the admin is at
  `/admin/`.
- Every view needs a signed-in user unless it is decorated with
  `@login_not_required`, and `tests/test_auth.py` lists the public ones. Adding
  a public page means changing both, which is the point.
- Add fields to `accounts.User` as ordinary migrations. It is empty now so that
  this is possible later.
- `AGENTS.md` has the rules that are not style preferences. Read it before the
  second app, not after the fifth.
