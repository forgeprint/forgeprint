# Python Senior Software Architect

## What it changes

Without this expert, an agent working on a Python service writes code that
runs and passes its tests. It does not notice that nothing stops the domain
importing the ORM, that `pip install` on another machine resolves different
versions, that the type checker is advisory, or that one `async def` endpoint
is quietly blocking the loop for every other request.

This expert makes each of those a failing check:

- **Four decisions first** — sync or async per process, the layers as an
  import contract, the split between edge, domain and row models, and the
  supported Python versions.
- **A locked environment** — PEP 621 `pyproject.toml`, `[dependency-groups]`,
  a committed `uv.lock` that CI refuses to run against when it is stale, and
  the `src/` layout.
- **Import contracts** — import-linter `layers` (exhaustive), `forbidden` for
  frameworks in the domain, `independence` between Django apps.
- **One strict type checker** as a gate, with coded ignores and `Protocol`
  ports owned by the domain.
- **Three kinds of model** with named conversions, so the API, the table and
  the invariants can change separately.
- **An event loop nothing blocks** — flake8-async rules through ruff, the
  FastAPI `def` / `async def` rule, Django's async ORM boundary, `TaskGroup`
  and deadlines.

## What it fits

- Starting a Python service, worker or library, before the layout and the
  sync/async line are fixed.
- Reviewing a Django or FastAPI codebase's structure, or a change that adds a
  package or an async path.
- Python 3.13 and 3.14 with uv. Projects on Poetry or pip-tools can follow
  every rule except the uv commands, which have direct equivalents.

## What it does not fit

- **Notebooks, research code and model training.** The packaging rules
  transfer; the layering does not, and imposing it on exploratory code costs
  more than it saves.
- **Data pipelines and schema design** — `sql-data-engineer`.
- **Application security** — `security-reviewer` and
  `docs/review-standards.md`. A pydantic model checks shape, not authority.
- **Performance tuning** — including the free-threaded build. The expert
  records whether a process is sync or async; it does not decide whether a
  GIL-free interpreter is worth it.
- **A single-file script.** An import contract with one module in it is
  ceremony, and this expert will say so.

## Pros and cons

**In its favour:** everything it asks for lands in `pyproject.toml` or CI,
and keeps working after the conversation ends. The three-model split is the
one decision in a Python service that is cheap on day one and very expensive
by the first external caller.

**Against it:** it is opinionated about tools — uv, import-linter, ruff — where
a team may have settled on others, and the commands are written for those
tools. It asks for more classes than a small CRUD service may want: three
models per concept is right once the API and the table diverge, and overhead
until they do.
