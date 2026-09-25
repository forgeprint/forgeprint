# Setup

Creates a Flask 3.1 JSON API: an application factory that refuses to start in
production without a real signing key, one blueprint per resource, notes that
belong to the caller who created them, Flask-SQLAlchemy models with
Flask-Migrate migrations on Postgres, pydantic validation at the boundary,
every error as an RFC 9457 problem document, tests that prove each of those
claims against a real database, and gunicorn in a non-root container.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.13 or newer, Docker (for Postgres and the image) and `curl`
for the checks against the running container.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   flask==3.1.3
   flask-sqlalchemy==3.1.1
   flask-migrate==4.1.0
   sqlalchemy==2.0.54
   alembic==1.20.0
   psycopg[binary]==3.3.6
   pydantic==2.13.5
   pyjwt==2.15.0
   gunicorn==26.2.0
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   ruff==0.16.9
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import flask, flask_migrate, flask_sqlalchemy; from importlib.metadata import version; assert version('flask') == '3.1.3'"`

6. Create `app/config.py` with:

   ```python
   """Configuration, read from the environment here and nowhere else.

   `Config.from_environ` is the only code in the project that reads
   `os.environ`. `create_app` takes a `Config`, so the tests build one
   directly, and a deployment that is missing a value stops while it starts
   instead of answering 500 once it is serving.
   """

   import os
   from collections.abc import Mapping
   from dataclasses import dataclass

   # What development and the tests fall back to when JWT_SECRET is unset.
   # Named so production can refuse it: a development key that reaches
   # production lets anyone who has read this file sign tokens.
   LOCAL_ONLY_JWT_SECRET = "local-development-only-not-a-real-secret"  # noqa: S105

   # RFC 7518 section 3.2: an HS256 key is at least as long as the hash.
   MINIMUM_SECRET_BYTES = 32

   ENVIRONMENTS = ("development", "test", "production")


   class ConfigError(RuntimeError):
       """The environment cannot run this service. Raised at startup only."""


   @dataclass(frozen=True)
   class Config:
       environment: str
       database_url: str
       jwt_secret: str
       jwt_audience: str = "api"
       # The largest request body Flask will read, in bytes. Werkzeug answers
       # 413 before a route sees a bigger one (OWASP API4:2023).
       max_content_length: int = 64 * 1024

       def __post_init__(self) -> None:
           if self.environment not in ENVIRONMENTS:
               raise ConfigError(
                   f"APP_ENV must be one of {', '.join(ENVIRONMENTS)}, not {self.environment!r}."
               )
           if not self.database_url:
               raise ConfigError("DATABASE_URL is not set.")
           if self.environment == "production":
               refuse_weak_secret(self.jwt_secret)

       @classmethod
       def from_environ(cls, environ: Mapping[str, str] = os.environ) -> "Config":
           # Unset means production, so a deployment that forgot APP_ENV gets
           # the strict checks rather than the lenient ones.
           environment = environ.get("APP_ENV", "").strip() or "production"
           secret = environ.get("JWT_SECRET", "").strip()
           if not secret and environment != "production":
               secret = LOCAL_ONLY_JWT_SECRET
           return cls(
               environment=environment,
               database_url=environ.get("DATABASE_URL", "").strip(),
               jwt_secret=secret,
               jwt_audience=environ.get("JWT_AUDIENCE", "").strip() or "api",
           )


   def refuse_weak_secret(secret: str) -> None:
       """The production bar for the signing key, as a refusal to start."""
       if not secret:
           raise ConfigError("JWT_SECRET is not set.")
       # Every placeholder in this project carries that phrase, and a
       # placeholder is published: whoever reads it can sign tokens.
       if secret == LOCAL_ONLY_JWT_SECRET or "not-a-real-secret" in secret:
           raise ConfigError(
               "JWT_SECRET is a published placeholder. Generate one with: "
               "python -c 'import secrets; print(secrets.token_urlsafe(48))'"
           )
       if len(secret.encode()) < MINIMUM_SECRET_BYTES:
           raise ConfigError(f"JWT_SECRET is shorter than {MINIMUM_SECRET_BYTES} bytes.")
   ```

   Verify: `test -f app/config.py`

7. Create `app/extensions.py` with:

   ```python
   """The extension objects, created unbound; `create_app` binds them.

   They live here rather than in app/__init__.py so that models and
   blueprints can import them without importing the factory, which is the
   import cycle Flask projects most often trip over.
   """

   from flask_migrate import Migrate
   from flask_sqlalchemy import SQLAlchemy
   from sqlalchemy import MetaData
   from sqlalchemy.orm import DeclarativeBase


   class Base(DeclarativeBase):
       # Named constraints, so a migration can drop or alter one by a name
       # that is the same on every database it has ever run against.
       metadata = MetaData(
           naming_convention={
               "ix": "ix_%(column_0_label)s",
               "uq": "uq_%(table_name)s_%(column_0_name)s",
               "ck": "ck_%(table_name)s_%(constraint_name)s",
               "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
               "pk": "pk_%(table_name)s",
           }
       )


   db = SQLAlchemy(model_class=Base)
   migrate = Migrate()
   ```

   Verify: `test -f app/extensions.py`

8. Create `app/models.py` with:

   ```python
   from datetime import UTC, datetime

   from sqlalchemy import DateTime, String, Text
   from sqlalchemy.orm import Mapped, mapped_column

   from app.extensions import db


   class Note(db.Model):
       __tablename__ = "notes"

       id: Mapped[int] = mapped_column(primary_key=True)
       # The token's subject. Every query for notes filters on it; see
       # `owned()` in app/notes.py.
       owner: Mapped[str] = mapped_column(String(255), index=True)
       title: Mapped[str] = mapped_column(String(200))
       body: Mapped[str] = mapped_column(Text)
       created_at: Mapped[datetime] = mapped_column(
           DateTime(timezone=True), default=lambda: datetime.now(UTC)
       )
   ```

   Verify: `test -f app/models.py`

9. Create `app/schemas.py` with:

   ```python
   """What crosses the boundary, in both directions."""

   from datetime import datetime

   from pydantic import BaseModel, ConfigDict, Field


   class NoteIn(BaseModel):
       # extra="forbid": a body that names `owner` or `id` is refused, not
       # quietly ignored. The owner is the token's subject and nothing else
       # (OWASP API3:2023). strict=True: JSON types only, no coercion.
       model_config = ConfigDict(extra="forbid", strict=True)

       title: str = Field(min_length=1, max_length=200)
       body: str = Field(default="", max_length=10_000)


   class NoteOut(BaseModel):
       model_config = ConfigDict(from_attributes=True)

       id: int
       title: str
       body: str
       created_at: datetime


   class Page(BaseModel):
       """A page of a list. Capped, because an uncapped list is a request
       that grows with the table (OWASP API4:2023)."""

       model_config = ConfigDict(extra="forbid")

       limit: int = Field(default=20, ge=1, le=100)
       after: int | None = Field(default=None, ge=0)
   ```

   Verify: `test -f app/schemas.py`

10. Create `app/validation.py` with:

    ```python
    """The boundary: request data becomes a model here or the request ends.

    Routes call `from_body` and `from_query` and get a validated model back.
    Nothing reads `request.json` or `request.args` directly, so there is no
    route that trusts input it did not validate.
    """

    from flask import request
    from pydantic import BaseModel, ValidationError


    class InvalidRequest(Exception):
        """Carries RFC 9457 `errors` members to the handler in app/errors.py."""

        def __init__(self, errors: list[dict[str, str]]) -> None:
            super().__init__("the request failed validation")
            self.errors = errors


    def from_body[M: BaseModel](model: type[M]) -> M:
        # A body that is not JSON is 415 and JSON that does not parse is 400.
        # Flask raises both here, and app/errors.py answers them.
        data = request.get_json()
        try:
            return model.model_validate(data)
        except ValidationError as error:
            raise InvalidRequest(
                [
                    # A JSON Pointer to the member, as RFC 9457's own example does.
                    {
                        "pointer": "#" + "".join(f"/{part}" for part in item["loc"]),
                        "detail": item["msg"],
                    }
                    for item in error.errors(include_url=False, include_input=False)
                ]
            ) from error


    def from_query[M: BaseModel](model: type[M]) -> M:
        try:
            return model.model_validate(request.args.to_dict())
        except ValidationError as error:
            raise InvalidRequest(
                [
                    {"parameter": ".".join(str(part) for part in item["loc"]), "detail": item["msg"]}
                    for item in error.errors(include_url=False, include_input=False)
                ]
            ) from error
    ```

    Verify: `test -f app/validation.py`

11. Create `app/errors.py` with:

    ```python
    """Every error leaves as an RFC 9457 problem document, and from here.

    Three handlers: the HTTP errors Flask and Werkzeug raise (404, 405, 413,
    415, and the 401 from app/auth.py), validation failures from
    app/validation.py, and anything else. A route raises; it never builds an
    error body of its own.
    """

    from typing import Any

    from flask import Flask, Response, current_app, jsonify
    from werkzeug.exceptions import HTTPException

    from app.validation import InvalidRequest

    MEDIA_TYPE = "application/problem+json"


    def problem(status: int, title: str, detail: str | None = None, **members: Any) -> Response:
        body: dict[str, Any] = {"type": "about:blank", "title": title, "status": status}
        if detail:
            body["detail"] = detail
        body.update(members)
        response = jsonify(body)
        response.status_code = status
        response.mimetype = MEDIA_TYPE
        return response


    def register(app: Flask) -> None:
        app.register_error_handler(HTTPException, _http_error)
        app.register_error_handler(InvalidRequest, _invalid)
        app.register_error_handler(Exception, _unexpected)


    def _http_error(error: HTTPException) -> Response:
        response = problem(error.code or 500, error.name, error.description)
        # The headers the exception carries still apply: WWW-Authenticate on
        # a 401, Allow on a 405.
        for name, value in error.get_headers():
            if name.lower() != "content-type":
                response.headers[name] = value
        return response


    def _invalid(error: InvalidRequest) -> Response:
        return problem(
            422, "Unprocessable Content", "The request failed validation.", errors=error.errors
        )


    def _unexpected(error: Exception) -> Response:
        # The whole exception goes to the log, where an operator reads it. The
        # caller gets the status and nothing about why: a message can carry a
        # query, a host name or a credential (OWASP A10:2025).
        current_app.logger.error("unhandled error", exc_info=error)
        return problem(500, "Internal Server Error", "The server could not complete the request.")
    ```

    Verify: `test -f app/errors.py`

12. Create `app/auth.py` with:

    ```python
    """Who is calling. The only module that reads the Authorization header or
    decodes a token.

    A blueprint that serves a caller's data registers `authenticate` as its
    `before_request`, so every route in it is protected by being in it. There
    is no per-route decorator to forget.
    """

    import jwt
    from flask import current_app, g, request
    from werkzeug.datastructures import WWWAuthenticate
    from werkzeug.exceptions import Unauthorized

    # One algorithm, named here. Letting the token choose is how `alg: none`
    # and key confusion get in (RFC 8725 section 3.1).
    ALGORITHMS = ["HS256"]
    LEEWAY_SECONDS = 30
    # The width of Note.owner.
    MAX_SUBJECT_LENGTH = 255


    def _refuse(detail: str, reason: str) -> Unauthorized:
        # Why, for the operator; never the token itself, which is a credential
        # until it expires (ASVS 5.0 16.3.1).
        current_app.logger.warning(
            "refused a bearer token on %s %s: %s", request.method, request.path, reason
        )
        return Unauthorized(detail, www_authenticate=WWWAuthenticate("bearer"))


    def authenticate() -> None:
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise _refuse("A bearer token is required.", "no bearer token")
        try:
            claims = jwt.decode(
                token,
                current_app.config["JWT_SECRET"],
                algorithms=ALGORITHMS,
                audience=current_app.config["JWT_AUDIENCE"],
                # A token that never expires is a credential that never
                # expires; one with no subject has nobody to scope rows to.
                options={"require": ["exp", "sub", "aud"]},
                leeway=LEEWAY_SECONDS,
            )
        except jwt.PyJWTError as error:
            raise _refuse("The bearer token is not valid.", type(error).__name__) from error
        subject = claims["sub"]
        if not isinstance(subject, str) or not 0 < len(subject) <= MAX_SUBJECT_LENGTH:
            raise _refuse("The bearer token is not valid.", "unusable subject")
        g.caller = subject


    def caller() -> str:
        """The verified subject. Only meaningful under a blueprint that ran
        `authenticate`, which is every blueprint that serves a caller's data."""
        return g.caller
    ```

    Verify: `test -f app/auth.py`

13. Create `app/health.py` with:

    ```python
    """Liveness and readiness: the only routes that answer without a token."""

    from flask import Blueprint, abort, current_app
    from sqlalchemy import text
    from sqlalchemy.exc import SQLAlchemyError

    from app.extensions import db

    bp = Blueprint("health", __name__)


    @bp.get("/health")
    def health() -> dict[str, str]:
        """Liveness: the process answers. It touches nothing, so a slow
        database never gets a working container restarted."""
        return {"status": "ok"}


    @bp.get("/ready")
    def ready() -> dict[str, str]:
        """Readiness: the database answers too. While this is 503 a load
        balancer stops sending traffic; nothing restarts."""
        try:
            db.session.execute(text("SELECT 1"))
        except SQLAlchemyError as error:
            current_app.logger.warning("not ready: %s", type(error).__name__)
            abort(503, description="The database is not reachable.")
        return {"status": "ready"}
    ```

    Verify: `test -f app/health.py`

14. Create `app/notes.py` with:

    ```python
    """Notes: the one resource here, and the pattern for the next one.

    Every query starts from `owned()`, which filters on the caller. There is
    no code path that loads a note by id alone, because that path is how one
    caller reads another's (OWASP API1:2023). A note that is not the caller's
    is 404, the same as one that does not exist, so the answer says nothing
    about other callers' data.
    """

    from typing import Any

    from flask import Blueprint, abort, url_for
    from sqlalchemy import Select, select

    from app.auth import authenticate, caller
    from app.extensions import db
    from app.models import Note
    from app.schemas import NoteIn, NoteOut, Page
    from app.validation import from_body, from_query

    bp = Blueprint("notes", __name__, url_prefix="/notes")
    bp.before_request(authenticate)


    def owned() -> Select[tuple[Note]]:
        return select(Note).where(Note.owner == caller())


    def _one(note_id: int) -> Note:
        note = db.session.scalar(owned().where(Note.id == note_id))
        if note is None:
            abort(404)
        return note


    def _out(note: Note) -> dict[str, Any]:
        return NoteOut.model_validate(note).model_dump(mode="json")


    @bp.get("")
    def list_notes() -> dict[str, Any]:
        page = from_query(Page)
        query = owned()
        if page.after is not None:
            query = query.where(Note.id > page.after)
        notes = db.session.scalars(query.order_by(Note.id).limit(page.limit)).all()
        # The cursor for the next page, or null on the last one.
        after = notes[-1].id if len(notes) == page.limit else None
        return {"items": [_out(note) for note in notes], "next": after}


    @bp.post("")
    def create_note() -> tuple[dict[str, Any], int, dict[str, str]]:
        data = from_body(NoteIn)
        note = Note(owner=caller(), title=data.title, body=data.body)
        db.session.add(note)
        db.session.commit()
        return _out(note), 201, {"Location": url_for("notes.get_note", note_id=note.id)}


    @bp.get("/<int:note_id>")
    def get_note(note_id: int) -> dict[str, Any]:
        return _out(_one(note_id))


    @bp.delete("/<int:note_id>")
    def delete_note(note_id: int) -> tuple[str, int]:
        db.session.delete(_one(note_id))
        db.session.commit()
        return "", 204
    ```

    Verify: `test -f app/notes.py`

15. Create `app/__init__.py` with:

    ```python
    """The application factory.

    `flask --app app ...`, gunicorn's `app:create_app()` and the tests all
    come through here. Nothing is created at import time: no app, no engine,
    no connection.
    """

    from flask import Flask, Response

    from app import errors, health, notes
    from app.config import Config
    from app.extensions import db, migrate


    def create_app(config: Config | None = None) -> Flask:
        config = config or Config.from_environ()
        # No static folder: this is a JSON API, and a static route is one more
        # URL that answers without a token.
        app = Flask(__name__, static_folder=None)
        app.config.update(
            SQLALCHEMY_DATABASE_URI=config.database_url,
            SQLALCHEMY_ENGINE_OPTIONS={
                "pool_pre_ping": True,
                "connect_args": {"connect_timeout": 5},
            },
            MAX_CONTENT_LENGTH=config.max_content_length,
            JWT_SECRET=config.jwt_secret,
            JWT_AUDIENCE=config.jwt_audience,
            TESTING=config.environment == "test",
        )
        db.init_app(app)
        migrate.init_app(app, db)
        errors.register(app)
        app.after_request(_response_headers)
        app.register_blueprint(health.bp)
        app.register_blueprint(notes.bp)
        return app


    def _response_headers(response: Response) -> Response:
        # A JSON response is never a document to sniff and render (ASVS 5.0
        # 3.4.4), and a caller's notes do not belong in a shared cache (14.3.2).
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Cache-Control", "no-store")
        return response
    ```

    Verify: `test -f app/__init__.py`

16. Create `scripts/dev_token.py` with:

    ```python
    """Sign a short-lived token for local development.

        python -m scripts.dev_token alice

    It signs with JWT_SECRET and JWT_AUDIENCE, as the service verifies, and
    it is not in the image. In production an identity provider issues
    tokens; nothing in this project does.
    """

    import os
    import sys
    import time

    import jwt

    from app.config import LOCAL_ONLY_JWT_SECRET

    LIFETIME_SECONDS = 15 * 60


    def main() -> None:
        subject = sys.argv[1]
        now = int(time.time())
        claims = {
            "sub": subject,
            "aud": os.environ.get("JWT_AUDIENCE", "api"),
            "iat": now,
            "exp": now + LIFETIME_SECONDS,
        }
        secret = os.environ.get("JWT_SECRET") or LOCAL_ONLY_JWT_SECRET
        print(jwt.encode(claims, secret, algorithm="HS256"))


    if __name__ == "__main__":
        main()
    ```

    Verify: `test -f scripts/dev_token.py`

17. Create `tests/__init__.py` with:

    ```python
    """The tests. They need TEST_DATABASE_URL: a Postgres database they may empty."""
    ```

    Verify: `test -f tests/__init__.py`

18. Create `tests/support.py` with:

    ```python
    import os
    import time
    from typing import Any

    import jwt
    import pytest

    from app.config import Config

    SECRET = "tests-only-signing-key-not-a-real-secret-0123456789"
    AUDIENCE = "api"
    UNREACHABLE_DATABASE = "postgresql+psycopg://app:unused@127.0.0.1:1/app"


    def make_config(**overrides: Any) -> Config:
        url = os.environ.get("TEST_DATABASE_URL", "")
        # The tests downgrade this database to nothing. A name that does not
        # end in _test is somebody's data, and the run stops before touching it.
        if not url.split("?")[0].endswith("_test"):
            pytest.exit("TEST_DATABASE_URL must name a Postgres database ending in _test.", 2)
        values: dict[str, Any] = {
            "environment": "test",
            "database_url": url,
            "jwt_secret": SECRET,
            "jwt_audience": AUDIENCE,
        }
        return Config(**(values | overrides))


    def bearer(
        subject: str,
        *,
        secret: str = SECRET,
        audience: str = AUDIENCE,
        lifetime: int = 300,
        **claims: Any,
    ) -> dict[str, str]:
        now = int(time.time())
        payload = {"sub": subject, "aud": audience, "iat": now, "exp": now + lifetime} | claims
        return {"Authorization": f"Bearer {jwt.encode(payload, secret, algorithm='HS256')}"}
    ```

    Verify: `test -f tests/support.py`

19. Create `tests/conftest.py` with:

    ```python
    from collections.abc import Iterator

    import pytest
    from flask import Flask
    from flask.testing import FlaskClient
    from flask_migrate import downgrade, upgrade
    from sqlalchemy import delete

    from app import create_app
    from app.extensions import db
    from app.models import Note
    from tests.support import make_config


    @pytest.fixture(scope="session")
    def app() -> Iterator[Flask]:
        app = create_app(make_config())
        with app.app_context():
            # Down to nothing and back up, on the database the tests use:
            # every migration applies, and so does every downgrade.
            downgrade(revision="base")
            upgrade()
        yield app


    @pytest.fixture
    def client(app: Flask) -> Iterator[FlaskClient]:
        yield app.test_client()
        with app.app_context():
            db.session.execute(delete(Note))
            db.session.commit()
    ```

    Verify: `test -f tests/conftest.py`

20. Create `tests/test_config.py` with:

    ```python
    import secrets

    import pytest

    from app import create_app
    from app.config import LOCAL_ONLY_JWT_SECRET, Config, ConfigError

    URL = "postgresql+psycopg://app:unused@127.0.0.1:1/app"


    def test_an_unset_environment_is_production_and_needs_a_secret() -> None:
        with pytest.raises(ConfigError, match="JWT_SECRET is not set"):
            Config.from_environ({"DATABASE_URL": URL})


    def test_production_refuses_the_development_key() -> None:
        environ = {"APP_ENV": "production", "DATABASE_URL": URL, "JWT_SECRET": LOCAL_ONLY_JWT_SECRET}
        with pytest.raises(ConfigError, match="published placeholder"):
            Config.from_environ(environ)


    def test_production_refuses_any_published_placeholder() -> None:
        placeholder = "copied-from-the-readme-not-a-real-secret-0123456789"
        with pytest.raises(ConfigError, match="published placeholder"):
            Config.from_environ({"DATABASE_URL": URL, "JWT_SECRET": placeholder})


    def test_production_refuses_a_short_key() -> None:
        with pytest.raises(ConfigError, match="shorter than 32 bytes"):
            Config.from_environ({"DATABASE_URL": URL, "JWT_SECRET": "x" * 31})


    def test_production_accepts_a_generated_key() -> None:
        config = Config.from_environ({"DATABASE_URL": URL, "JWT_SECRET": secrets.token_urlsafe(48)})
        assert config.environment == "production"


    def test_development_falls_back_to_the_local_key() -> None:
        config = Config.from_environ({"APP_ENV": "development", "DATABASE_URL": URL})
        assert config.jwt_secret == LOCAL_ONLY_JWT_SECRET


    @pytest.mark.parametrize("environment", ["development", "test", "production"])
    def test_every_environment_needs_a_database_url(environment: str) -> None:
        environ = {"APP_ENV": environment, "JWT_SECRET": secrets.token_urlsafe(48)}
        with pytest.raises(ConfigError, match="DATABASE_URL is not set"):
            Config.from_environ(environ)


    def test_an_unknown_environment_is_refused() -> None:
        with pytest.raises(ConfigError, match="APP_ENV must be one of"):
            Config.from_environ({"APP_ENV": "prod", "DATABASE_URL": URL})


    def test_the_factory_refuses_to_build_an_app(monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("APP_ENV", "production")
        monkeypatch.setenv("DATABASE_URL", URL)
        monkeypatch.delenv("JWT_SECRET", raising=False)
        with pytest.raises(ConfigError, match="JWT_SECRET is not set"):
            create_app()
    ```

    Verify: `test -f tests/test_config.py`

21. Create `tests/test_auth.py` with:

    ```python
    import logging

    import jwt
    import pytest
    from flask import Flask, url_for
    from flask.testing import FlaskClient

    from tests.support import AUDIENCE, SECRET, bearer

    # The endpoints that answer without a token. Making a route public means
    # adding it here, on purpose, in the same change.
    PUBLIC = {"health.health", "health.ready"}


    def test_every_other_route_refuses_an_anonymous_caller(app: Flask, client: FlaskClient) -> None:
        checked = 0
        for rule in app.url_map.iter_rules():
            if rule.endpoint in PUBLIC:
                continue
            with app.test_request_context():
                url = url_for(rule.endpoint, **dict.fromkeys(rule.arguments, 1))
            for method in sorted((rule.methods or set()) - {"HEAD", "OPTIONS"}):
                response = client.open(url, method=method)
                assert response.status_code == 401, f"{method} {url} answered {response.status_code}"
                assert response.headers["WWW-Authenticate"] == "Bearer"
                assert response.mimetype == "application/problem+json"
                checked += 1
        assert checked >= 4


    @pytest.mark.parametrize("header", ["Bearer", "Bearer ", "Basic YWxpY2U6c2VjcmV0", "alice"])
    def test_a_header_that_is_not_a_bearer_token_is_refused(client: FlaskClient, header: str) -> None:
        assert client.get("/notes", headers={"Authorization": header}).status_code == 401


    def test_a_token_signed_with_another_key_is_refused(client: FlaskClient) -> None:
        forged = bearer("alice", secret="another-key-that-is-long-enough-for-hs256-0123")
        assert client.get("/notes", headers=forged).status_code == 401


    def test_a_token_for_another_audience_is_refused(client: FlaskClient) -> None:
        elsewhere = bearer("alice", audience="another-service")
        assert client.get("/notes", headers=elsewhere).status_code == 401


    def test_an_expired_token_is_refused(client: FlaskClient) -> None:
        assert client.get("/notes", headers=bearer("alice", lifetime=-120)).status_code == 401


    def test_a_token_that_never_expires_is_refused(client: FlaskClient) -> None:
        token = jwt.encode({"sub": "alice", "aud": AUDIENCE}, SECRET, algorithm="HS256")
        response = client.get("/notes", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


    def test_an_unsigned_token_is_refused(client: FlaskClient) -> None:
        token = jwt.encode({"sub": "alice", "aud": AUDIENCE, "exp": 4102444800}, None, algorithm="none")
        response = client.get("/notes", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


    def test_a_refusal_is_logged_with_its_reason_and_without_the_token(
        client: FlaskClient, caplog: pytest.LogCaptureFixture
    ) -> None:
        forged = bearer("alice", secret="another-key-that-is-long-enough-for-hs256-0123")
        with caplog.at_level(logging.WARNING):
            client.get("/notes", headers=forged)
        assert "InvalidSignatureError" in caplog.text
        assert forged["Authorization"].removeprefix("Bearer ") not in caplog.text


    def test_a_valid_token_is_accepted(client: FlaskClient) -> None:
        response = client.get("/notes", headers=bearer("alice"))
        assert response.status_code == 200
        assert response.get_json() == {"items": [], "next": None}
    ```

    Verify: `test -f tests/test_auth.py`

22. Create `tests/test_notes.py` with:

    ```python
    from typing import Any

    from flask.testing import FlaskClient

    from tests.support import bearer

    PROBLEM = "application/problem+json"


    def create(client: FlaskClient, owner: str, title: str) -> dict[str, Any]:
        response = client.post("/notes", json={"title": title}, headers=bearer(owner))
        assert response.status_code == 201
        return response.get_json()


    def test_a_caller_creates_and_reads_their_own_note(client: FlaskClient) -> None:
        body = {"title": "first", "body": "hello"}
        response = client.post("/notes", json=body, headers=bearer("alice"))
        assert response.status_code == 201
        note = response.get_json()
        assert response.headers["Location"] == f"/notes/{note['id']}"
        read = client.get(response.headers["Location"], headers=bearer("alice"))
        assert read.status_code == 200
        assert read.get_json()["body"] == "hello"


    def test_one_caller_cannot_read_another_callers_note(client: FlaskClient) -> None:
        note = create(client, "alice", "only alice may read this")
        response = client.get(f"/notes/{note['id']}", headers=bearer("bob"))
        assert response.status_code == 404
        assert "only alice" not in response.get_data(as_text=True)


    def test_one_caller_cannot_delete_another_callers_note(client: FlaskClient) -> None:
        note = create(client, "alice", "keep")
        assert client.delete(f"/notes/{note['id']}", headers=bearer("bob")).status_code == 404
        assert client.get(f"/notes/{note['id']}", headers=bearer("alice")).status_code == 200


    def test_a_list_holds_only_the_callers_notes(client: FlaskClient) -> None:
        create(client, "alice", "a1")
        create(client, "bob", "b1")
        create(client, "alice", "a2")
        items = client.get("/notes", headers=bearer("alice")).get_json()["items"]
        assert [item["title"] for item in items] == ["a1", "a2"]


    def test_the_owner_deletes_their_note(client: FlaskClient) -> None:
        note = create(client, "alice", "gone")
        assert client.delete(f"/notes/{note['id']}", headers=bearer("alice")).status_code == 204
        assert client.get(f"/notes/{note['id']}", headers=bearer("alice")).status_code == 404


    def test_a_caller_cannot_choose_the_owner(client: FlaskClient) -> None:
        response = client.post("/notes", json={"title": "x", "owner": "bob"}, headers=bearer("alice"))
        assert response.status_code == 422
        errors = response.get_json()["errors"]
        assert {"pointer": "#/owner", "detail": "Extra inputs are not permitted"} in errors


    def test_an_invalid_body_is_a_problem_document(client: FlaskClient) -> None:
        response = client.post("/notes", json={"title": ""}, headers=bearer("alice"))
        assert response.status_code == 422
        assert response.mimetype == PROBLEM
        problem = response.get_json()
        assert problem["type"] == "about:blank"
        assert problem["status"] == 422
        assert [error["pointer"] for error in problem["errors"]] == ["#/title"]


    def test_a_body_that_is_not_json_is_refused(client: FlaskClient) -> None:
        response = client.post("/notes", data={"title": "x"}, headers=bearer("alice"))
        assert response.status_code == 415
        assert response.mimetype == PROBLEM


    def test_json_that_does_not_parse_is_refused(client: FlaskClient) -> None:
        response = client.post(
            "/notes", data="{", content_type="application/json", headers=bearer("alice")
        )
        assert response.status_code == 400
        assert response.mimetype == PROBLEM


    def test_an_oversized_body_is_refused_before_it_is_read(client: FlaskClient) -> None:
        response = client.post("/notes", json={"title": "x" * 70_000}, headers=bearer("alice"))
        assert response.status_code == 413
        assert response.mimetype == PROBLEM


    def test_a_page_is_capped(client: FlaskClient) -> None:
        response = client.get("/notes?limit=101", headers=bearer("alice"))
        assert response.status_code == 422
        assert [error["parameter"] for error in response.get_json()["errors"]] == ["limit"]


    def test_pages_follow_the_cursor(client: FlaskClient) -> None:
        for title in ("one", "two", "three"):
            create(client, "alice", title)
        first = client.get("/notes?limit=2", headers=bearer("alice")).get_json()
        assert [item["title"] for item in first["items"]] == ["one", "two"]
        second = client.get(f"/notes?limit=2&after={first['next']}", headers=bearer("alice")).get_json()
        assert [item["title"] for item in second["items"]] == ["three"]
        assert second["next"] is None
    ```

    Verify: `test -f tests/test_notes.py`

23. Create `tests/test_errors.py` with:

    ```python
    from flask.testing import FlaskClient

    from app import create_app
    from tests.support import UNREACHABLE_DATABASE, make_config

    PROBLEM = "application/problem+json"


    def test_an_unknown_url_is_a_problem_document(client: FlaskClient) -> None:
        response = client.get("/nowhere")
        assert response.status_code == 404
        assert response.mimetype == PROBLEM
        assert response.get_json()["title"] == "Not Found"


    def test_a_wrong_method_keeps_the_allow_header(client: FlaskClient) -> None:
        response = client.put("/notes")
        assert response.status_code == 405
        assert response.mimetype == PROBLEM
        assert "POST" in response.headers["Allow"]


    def test_an_unexpected_error_does_not_reach_the_caller() -> None:
        app = create_app(make_config())

        @app.get("/boom")
        def boom() -> str:
            raise RuntimeError("could not connect with password hunter2")

        response = app.test_client().get("/boom")
        assert response.status_code == 500
        assert response.mimetype == PROBLEM
        assert "hunter2" not in response.get_data(as_text=True)


    def test_every_response_is_nosniff_and_no_store(client: FlaskClient) -> None:
        for url in ("/health", "/nowhere", "/notes"):
            response = client.get(url)
            assert response.headers["X-Content-Type-Options"] == "nosniff", url
            assert response.headers["Cache-Control"] == "no-store", url


    def test_readiness_answers_while_the_database_does(client: FlaskClient) -> None:
        assert client.get("/ready").get_json() == {"status": "ready"}


    def test_readiness_is_503_and_liveness_is_200_without_a_database() -> None:
        client = create_app(make_config(database_url=UNREACHABLE_DATABASE)).test_client()
        ready = client.get("/ready")
        assert ready.status_code == 503
        assert ready.mimetype == PROBLEM
        assert client.get("/health").status_code == 200
    ```

    Verify: `test -f tests/test_errors.py`

24. Create `tests/test_migrations.py` with:

    ```python
    from flask import Flask
    from flask_migrate import check


    def test_the_models_and_the_migrations_agree(app: Flask) -> None:
        """Fails when a model changed and nobody ran `flask db migrate`: the
        change would otherwise reach production as a missing column."""
        with app.app_context():
            check()
    ```

    Verify: `test -f tests/test_migrations.py`

25. Create `pyproject.toml` with:

    ```toml
    [tool.ruff]
    target-version = "py313"
    line-length = 100
    # Generated by Flask-Migrate and reviewed by a person, not formatted.
    extend-exclude = ["migrations"]

    [tool.ruff.lint]
    select = ["E", "F", "I", "B", "UP", "S", "SIM"]

    [tool.ruff.lint.per-file-ignores]
    # pytest checks with assert, and the keys in the tests sign test tokens.
    "tests/**" = ["S101", "S105", "S106"]

    [tool.pytest.ini_options]
    testpaths = ["tests"]
    pythonpath = ["."]
    addopts = "-q"
    ```

    Verify: `test -f pyproject.toml`

26. Create `.gitignore` with:

    ```gitignore
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    .ruff_cache/
    .env
    python.path
    db.url
    test-db.url
    jwt.secret
    api.addr
    *.token
    note.path
    *.status
    refused.log
    refused.code
    ```

    Verify: `test -f .gitignore`

27. Create `.dockerignore` with:

    ```gitignore
    .venv/
    **/__pycache__/
    **/*.pyc
    .pytest_cache/
    .ruff_cache/
    .git/
    .github/
    tests/
    scripts/
    .env
    *.url
    jwt.secret
    *.token
    ```

    Verify: `test -f .dockerignore`

28. Create `Dockerfile` with:

    ```dockerfile
    FROM python:3.13.15-slim AS build
    ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --prefix=/install -r requirements.txt

    FROM python:3.13.15-slim AS runtime
    ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 WEB_CONCURRENCY=2
    # A non-root user, because a process that does not need root should not have it.
    RUN useradd --create-home --uid 10001 service
    WORKDIR /app
    COPY --from=build /install /usr/local
    COPY app ./app
    COPY migrations ./migrations
    USER 10001
    EXPOSE 8000
    HEALTHCHECK --interval=5s --timeout=3s --retries=6 CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]
    # gunicorn reads WEB_CONCURRENCY for the worker count, and calls the
    # factory once per worker; a configuration error stops every one of them.
    CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "app:create_app()"]
    ```

    Verify: `test -f Dockerfile`

29. Create `compose.yaml` with:

    ```yaml
    # Local development and the check against the image. Nothing here is a
    # production configuration.
    services:
      db:
        image: postgres:18.6-alpine
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
          # The first start initialises the cluster and flushes it to disk.
          # Skipping the flush risks only this throwaway database.
          POSTGRES_INITDB_ARGS: --no-sync
        # Loopback, and no fixed host port: 5432 is usually taken already.
        # `docker compose port db 5432` says which one Docker chose.
        ports: ['127.0.0.1::5432']
        healthcheck:
          # Over TCP on purpose: during initialisation the image runs a
          # temporary server on the Unix socket only.
          test: ['CMD-SHELL', 'pg_isready -h 127.0.0.1 -U app -d app']
          interval: 2s
          retries: 15
          start_period: 120s

      # The image as production runs it: APP_ENV is unset, which means
      # production, so JWT_SECRET must be real or gunicorn does not start.
      # Only with `--profile image`; `docker compose up` alone is the database.
      api:
        profiles: [image]
        build: .
        image: flask-api:dev
        environment:
          DATABASE_URL: postgresql+psycopg://app:local-development-only@db:5432/app
          JWT_SECRET: ${JWT_SECRET:-}
        ports: ['127.0.0.1::8000']
        read_only: true
        tmpfs: [/tmp]
        cap_drop: [ALL]
        security_opt: ['no-new-privileges:true']
        depends_on:
          db:
            condition: service_healthy
    ```

    Verify: `docker compose --profile image config --quiet`

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
        services:
          db:
            image: postgres:18.6-alpine
            env:
              POSTGRES_USER: app
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app_test
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -h 127.0.0.1 -U app -d app_test"
              --health-interval 2s
              --health-retries 15
        env:
          TEST_DATABASE_URL: postgresql+psycopg://app:local-development-only@127.0.0.1:5432/app_test
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - run: pip install -r requirements-dev.txt
          - run: ruff check .
          - run: ruff format --check .
          - run: pytest
          - run: docker build --tag flask-api:ci .
    ```

    Verify: `test -f .github/workflows/ci.yml`

31. Format the code, so the formatter check in CI starts from a clean tree: `"$(cat python.path)" -m ruff format .`
    Verify: `"$(cat python.path)" -m ruff format --check .`

32. Check the code against the linter: `"$(cat python.path)" -m ruff check .`
    Verify: `"$(cat python.path)" -m ruff check --quiet .`

33. Remove the containers an earlier attempt left behind, so this does not depend on a clean machine: `docker compose --profile image down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose --profile image ps -aq)"`

34. Start Postgres and wait until it accepts connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

35. Create the database the tests may empty, beside the one development uses: `docker compose exec -T db createdb -U app app_test`
    Verify: `docker compose exec -T db psql -U app -d app_test -tAc "select 1"`

36. Ask Docker which host port it chose, and write the development database URL once: `echo "postgresql+psycopg://app:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -Eq "^postgresql\+psycopg://app:local-development-only@127\.0\.0\.1:[0-9]+/app$" db.url`

37. Write the test database URL the same way: `echo "postgresql+psycopg://app:local-development-only@$(docker compose port db 5432)/app_test" > test-db.url`
    Verify: `grep -Eq "/app_test$" test-db.url`

38. Create the migrations directory: `APP_ENV=development DATABASE_URL="$(cat db.url)" "$(cat python.path)" -m flask --app app db init`
    Verify: `test -f migrations/env.py`

39. Generate the first migration from the models, against the empty database: `APP_ENV=development DATABASE_URL="$(cat db.url)" "$(cat python.path)" -m flask --app app db migrate -m "create notes"`
    Verify: `ls migrations/versions/*_create_notes.py`

40. Apply it to the development database: `APP_ENV=development DATABASE_URL="$(cat db.url)" "$(cat python.path)" -m flask --app app db upgrade`
    Verify: `APP_ENV=development DATABASE_URL="$(cat db.url)" "$(cat python.path)" -m flask --app app db check`

41. Run the tests. They prove that every route but the two health checks refuses an anonymous or forged caller, that one caller can neither read, list nor delete another's notes, that every error is a problem document, that production refuses a missing, placeholder or short key, and that the migrations go down and up and match the models: `TEST_DATABASE_URL="$(cat test-db.url)" "$(cat python.path)" -m pytest`
    Verify: `TEST_DATABASE_URL="$(cat test-db.url)" "$(cat python.path)" -m pytest`

42. Generate a signing key for the image check. It goes only into a file that .gitignore excludes, because production refuses any key that has been published: `"$(cat python.path)" -c "import secrets; print(secrets.token_urlsafe(48))" > jwt.secret`
    Verify: `test "$(wc -c < jwt.secret)" -ge 33`

43. Build the image: `docker compose --profile image build api`
    Verify: `docker image inspect flask-api:dev`

44. Apply the migrations from the image, the way a release would, with the same production configuration the server gets: `JWT_SECRET="$(cat jwt.secret)" docker compose --profile image run --rm api flask --app app db upgrade`
    Verify: `JWT_SECRET="$(cat jwt.secret)" docker compose --profile image run --rm api flask --app app db check`

45. Start gunicorn from the image and wait until its health check passes: `JWT_SECRET="$(cat jwt.secret)" docker compose --profile image up -d --wait api`
    Verify: `test -n "$(docker compose --profile image ps -q api)"`

46. Ask Docker which host port the API got: `docker compose --profile image port api 8000 > api.addr`
    Verify: `curl -fsS "http://$(cat api.addr)/ready"`

47. Sign a token for one caller: `JWT_SECRET="$(cat jwt.secret)" "$(cat python.path)" -m scripts.dev_token alice > alice.token`
    Verify: `test -s alice.token`

48. Sign a token for a second caller: `JWT_SECRET="$(cat jwt.secret)" "$(cat python.path)" -m scripts.dev_token bob > bob.token`
    Verify: `test -s bob.token`

49. Create a note as the first caller and keep the address the API answers with: `curl -fsS -o /dev/null -w '%header{location}' -H "Authorization: Bearer $(cat alice.token)" -H "Content-Type: application/json" -d '{"title": "only alice may read this"}' "http://$(cat api.addr)/notes" > note.path`
    Verify: `curl -fsS -H "Authorization: Bearer $(cat alice.token)" "http://$(cat api.addr)$(cat note.path)" | grep -q "only alice may read this"`

50. Ask for the same note as the second caller: `curl -sS -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $(cat bob.token)" "http://$(cat api.addr)$(cat note.path)" > bob.status`
    Verify: `grep -qx 404 bob.status`

51. Ask for the list with no token at all: `curl -sS -o /dev/null -w '%{http_code}' "http://$(cat api.addr)/notes" > anonymous.status`
    Verify: `grep -qx 401 anonymous.status`

52. Confirm the image refuses the development key the way a deployment would meet it — gunicorn exits instead of serving: `JWT_SECRET="local-development-only-not-a-real-secret" docker compose --profile image run --rm --no-deps api > refused.log 2>&1; echo "$?" > refused.code`
    Verify: `grep -qv '^0$' refused.code && grep -q "published placeholder" refused.log`

53. Stop and remove the containers and the database volume: `docker compose --profile image down -v`
    Verify: `test -z "$(docker compose --profile image ps -aq)"`

## After setup

- `docker compose up -d --wait` starts the development database. Export
  `APP_ENV=development` and `DATABASE_URL="$(cat db.url)"`, then
  `flask --app app run --debug` serves on port 5000, and
  `python -m scripts.dev_token alice` signs a token to call it with.
- A model change is `flask --app app db migrate -m "..."`, then reading the
  generated file before `flask --app app db upgrade`. Autogenerate misses
  renames and some type changes; `tests/test_migrations.py` catches a model
  change that has no migration at all.
- Production sets `DATABASE_URL`, `JWT_SECRET` and, if the identity provider
  issues tokens for another audience, `JWT_AUDIENCE`. Leaving `APP_ENV` unset
  is production. Run `flask --app app db upgrade` from the image before a
  release starts serving.
- `AGENTS.md` has the rules that are not style preferences. Read it before
  the second blueprint, not after the fifth.
