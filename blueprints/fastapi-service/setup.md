# Setup

Creates a FastAPI service with SQLAlchemy async, bearer token verification,
tests, a container image and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires Python 3.11 or newer, Docker, and `curl` for the last check.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

<!-- if options.database == postgres -->

2. Create `requirements.txt` with:

   ```text
   fastapi==0.141.1
   uvicorn==0.53.0
   sqlalchemy==2.0.54
   asyncpg==0.31.0
   pydantic-settings==2.15.0
   pyjwt==2.14.0
   ```

   Verify: `test -f requirements.txt`

<!-- endif -->

<!-- if options.database == sqlite -->

2. Create `requirements.txt` with:

   ```text
   fastapi==0.141.1
   uvicorn==0.53.0
   sqlalchemy==2.0.54
   aiosqlite==0.22.1
   pydantic-settings==2.15.0
   pyjwt==2.14.0
   ```

   Verify: `test -f requirements.txt`

<!-- endif -->

3. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   pytest-asyncio==1.4.0
   httpx==0.28.1
   ```

   Verify: `test -f requirements-dev.txt`

4. Install the pinned dependencies: `./.venv/bin/pip install -r requirements-dev.txt || ./.venv/Scripts/pip.exe install -r requirements-dev.txt`
   Verify: `./.venv/bin/python -c "import fastapi" || ./.venv/Scripts/python.exe -c "import fastapi"`

5. Create `app/settings.py` with:

   ```python
   from functools import lru_cache

   from pydantic_settings import BaseSettings, SettingsConfigDict


   class Settings(BaseSettings):
       """Configuration, read from the environment and nowhere else.

       Every value has to be settable without editing a file, because the
       container is the same in every environment and only its environment
       differs.
       """

       model_config = SettingsConfigDict(env_file=".env", extra="forbid")

       database_url: str
       jwt_secret: str
       jwt_algorithm: str = "HS256"
       jwt_audience: str = "api"


   @lru_cache
   def get_settings() -> Settings:
       return Settings()  # type: ignore[call-arg]
   ```

   Verify: `test -f app/settings.py`

6. Create `app/security.py` with:

   ```python
   from typing import Annotated, Any

   import jwt
   from fastapi import Depends, HTTPException, status
   from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

   from app.settings import Settings, get_settings

   # auto_error=False so that a missing header reaches this module rather than
   # producing a 403 from the framework: the answer for "no credentials" is 401.
   _scheme = HTTPBearer(auto_error=False)


   def current_claims(
       credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_scheme)],
       settings: Annotated[Settings, Depends(get_settings)],
   ) -> dict[str, Any]:
       """The verified claims of the bearer token, or 401.

       Verification happens here and only here. A route that needs a user
       depends on this; nothing anywhere else reads the Authorization header.
       """
       if credentials is None:
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail="Not authenticated",
               headers={"WWW-Authenticate": "Bearer"},
           )
       try:
           return jwt.decode(
               credentials.credentials,
               settings.jwt_secret,
               algorithms=[settings.jwt_algorithm],
               audience=settings.jwt_audience,
           )
       except jwt.PyJWTError as error:
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail="Invalid token",
               headers={"WWW-Authenticate": "Bearer"},
           ) from error
   ```

   Verify: `test -f app/security.py`

7. Create `app/db.py` with:

   ```python
   from collections.abc import AsyncIterator
   from typing import Annotated

   from fastapi import Depends
   from sqlalchemy.ext.asyncio import (
       AsyncEngine,
       AsyncSession,
       async_sessionmaker,
       create_async_engine,
   )

   from app.settings import Settings, get_settings

   _engine: AsyncEngine | None = None


   def engine(settings: Settings) -> AsyncEngine:
       """One engine per process. It owns the connection pool, so making a
       second one quietly doubles the pool and halves what the database can
       serve."""
       global _engine
       if _engine is None:
           _engine = create_async_engine(settings.database_url, pool_pre_ping=True)
       return _engine


   async def session(
       settings: Annotated[Settings, Depends(get_settings)],
   ) -> AsyncIterator[AsyncSession]:
       factory = async_sessionmaker(engine(settings), expire_on_commit=False)
       async with factory() as active:
           yield active
   ```

   Verify: `test -f app/db.py`

8. Create `app/main.py` with:

   ```python
   from collections.abc import AsyncIterator
   from contextlib import asynccontextmanager
   from typing import Annotated, Any

   from fastapi import Depends, FastAPI

   from app.security import current_claims
   from app.settings import get_settings


   @asynccontextmanager
   async def lifespan(_: FastAPI) -> AsyncIterator[None]:
       """Read the configuration once, while the process is starting.

       A missing or misspelled variable has to stop the process. Left to the
       request dependency, it answers 500 to every call while /health still
       returns 200 and an orchestrator calls the container ready.

       In the lifespan rather than at import, because the tests import this
       module to drive the app in-process and supply their own environment.
       """
       get_settings()
       yield


   app = FastAPI(title="Service", version="0.1.0", lifespan=lifespan)


   @app.get("/health")
   def health() -> dict[str, str]:
       """Liveness only. It touches nothing, so it answers while the database
       is down — which is the point: it says the process is up, not that it is
       well."""
       return {"status": "ok"}


   @app.get("/me")
   def me(claims: Annotated[dict[str, Any], Depends(current_claims)]) -> dict[str, Any]:
       return {"subject": claims.get("sub")}
   ```

   Verify: `test -f app/main.py`

9. Create `pytest.ini` with:

   ```ini
   [pytest]
   asyncio_mode = auto
   ```

   Verify: `test -f pytest.ini`

10. Create `tests/test_api.py` with:

    ```python
    import jwt
    import pytest
    from httpx import ASGITransport, AsyncClient

    from app.main import app
    from app.settings import get_settings

    SECRET = "test-secret-not-used-anywhere-real-and-long-enough"


    @pytest.fixture(autouse=True)
    def settings(monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        monkeypatch.setenv("JWT_SECRET", SECRET)
        get_settings.cache_clear()


    @pytest.fixture
    async def client() -> AsyncClient:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://localhost") as active:
            yield active


    @pytest.mark.asyncio
    async def test_health_answers_without_a_token(client: AsyncClient) -> None:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


    @pytest.mark.asyncio
    async def test_a_protected_route_refuses_an_anonymous_caller(client: AsyncClient) -> None:
        response = await client.get("/me")
        assert response.status_code == 401


    @pytest.mark.asyncio
    async def test_a_protected_route_refuses_a_token_this_service_did_not_issue(
        client: AsyncClient,
    ) -> None:
        forged = jwt.encode(
            {"sub": "someone", "aud": "api"},
            "a-different-secret-that-is-also-long-enough-here",
            algorithm="HS256",
        )
        response = await client.get("/me", headers={"Authorization": f"Bearer {forged}"})
        assert response.status_code == 401


    @pytest.mark.asyncio
    async def test_a_protected_route_accepts_a_token_this_service_issued(
        client: AsyncClient,
    ) -> None:
        valid = jwt.encode({"sub": "user-1", "aud": "api"}, SECRET, algorithm="HS256")
        response = await client.get("/me", headers={"Authorization": f"Bearer {valid}"})
        assert response.status_code == 200
        assert response.json() == {"subject": "user-1"}
    ```

    Verify: `test -f tests/test_api.py`

11. Run the tests: `./.venv/bin/python -m pytest -q || ./.venv/Scripts/python.exe -m pytest -q`
    Verify: `./.venv/bin/python -m pytest -q || ./.venv/Scripts/python.exe -m pytest -q`

12. Create `.gitignore` with:

    ```gitignore
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    .env
    *.db
    ```

    Verify: `test -f .gitignore`

13. Create `.env.example` with:

    ```dotenv
    # Copy to .env for local development. Nothing here is a production value.
    DATABASE_URL=postgresql+asyncpg://app:local-development-only@localhost:5432/app
    JWT_SECRET=local-development-only-not-a-real-secret-32b
    JWT_AUDIENCE=api
    ```

    Verify: `test -f .env.example`

14. Create `Dockerfile` with:

    ```dockerfile
    FROM python:3.13-slim AS build
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

    FROM python:3.13-slim AS runtime
    # A non-root user, because a process that does not need root should not have it.
    RUN useradd --create-home --uid 10001 service
    WORKDIR /app
    COPY --from=build /install /usr/local
    COPY app ./app
    USER service
    EXPOSE 8000
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```

    Verify: `test -f Dockerfile`

15. Create `.dockerignore` with:

    ```gitignore
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    tests/
    .env
    ```

    Verify: `test -f .dockerignore`

<!-- if options.database == postgres -->

16. Create `compose.yaml` for the local database with:

    ```yaml
    # Local development only. Nothing here is a production configuration.
    services:
      db:
        image: postgres:18.2-alpine
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
        ports:
          - '127.0.0.1:5432:5432'
    ```

    Verify: `docker compose config`

<!-- endif -->

17. Create `.github/workflows/ci.yml` with:

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
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - run: pip install -r requirements-dev.txt
          - run: pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

18. Build the container image: `docker build --tag fastapi-service:dev .`
    Verify: `docker image inspect fastapi-service:dev`

19. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force fastapi-check 2>/dev/null || true`
    Verify: `test -z "$(docker ps --all --filter name=fastapi-check --quiet)"`

20. Start the container and check that it answers. The URL matches the driver this image installed, and the liveness endpoint never touches the database — which is why no database has to be running for this check to mean something: `docker run -d --name fastapi-check -e DATABASE_URL="$(test -f compose.yaml && echo 'postgresql+asyncpg://app:local-development-only@127.0.0.1:5432/app' || echo 'sqlite+aiosqlite:///./app.db')" -e JWT_SECRET="local-development-only-not-a-real-secret-32b" -p 127.0.0.1::8000 fastapi-service:dev`
    Verify: `curl -fsS --retry 30 --retry-delay 1 --retry-all-errors "http://$(docker port fastapi-check 8000)/health"`

21. Stop the check container: `docker rm --force fastapi-check`
    Verify: `docker ps --filter name=fastapi-check --quiet`

## After setup

- Nothing here issues a token. The tests show how one is signed with the same
  secret; in production that is an identity provider's job, and `JWT_AUDIENCE`
  is what stops a token issued for something else from working here.
- There are no models and no migrations. Add Alembic when the first model is
  real, and let that be a decision rather than something inherited.
- `AGENTS.md` has the rules that are not style preferences — one place that
  verifies tokens, one engine, and a `/health` that touches nothing. Read it
  before adding the second route, not after the fifth.
- `uvicorn app.main:app --reload` runs it locally; under the `postgres` option,
  `docker compose up -d` starts the database it talks to.
