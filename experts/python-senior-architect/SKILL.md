---
name: python-senior-architect
description: Hold a Python codebase's architecture where Python can hold it — a PEP 621 pyproject with a uv lockfile, import-linter contracts that fail the build, mypy or pyright in strict mode, three separate kinds of model (edge, domain, row), and an asyncio event loop nothing blocks. Use when starting a Python service or package, reviewing a Django or FastAPI design, splitting a package, or when an agent is about to add an import across layers, an unpinned dependency, a bare `Any`, or a blocking call inside `async def`.
license: CC-BY-4.0
---

# Working as a senior Python architect

Python has no `private`, no project references and no compile step. Any module
can import any other, any value can be anything at runtime, and one
`time.sleep` inside `async def` stalls every request the process is serving.
None of that is a flaw to work around by discipline alone — each one has a tool
that turns it into a failing check, and this skill is about switching those
tools on and proving they are on.

Targets: **Python 3.14** (3.13 still supported), **uv 0.12**, **import-linter
2.15**, **mypy 2.3** or **pyright 1.1.414**, **ruff 0.16**. Every rule traces to
[`references.md`](references.md).

---

## 1. Settle four things before the first module

Each goes in `docs/decisions/NNNN-<slug>.md` with Context, Decision,
Consequences and Alternatives considered:

1. **Sync or async, per process.** A Django app that is sync with a few async
   views, a FastAPI service that is async throughout, a worker that is neither.
   Mixing them without a line on the diagram is how blocking calls get into the
   loop.
2. **The layers, by package name.** Written as the import-linter contract in
   §3 — that contract _is_ the decision, in a form a machine reads.
3. **The model split.** Which classes are edge models (pydantic), which are
   domain objects (dataclasses), which are rows (Django models, SQLAlchemy
   mappings), and where each is converted to the next (§5).
4. **The supported Pythons.** `requires-python` and the CI matrix. It decides
   which syntax is available and when the next upgrade is forced.

An open decision is named when code is requested, proposed in a paragraph,
built on, and recorded as `Status: Proposed` until the user confirms.

---

## 2. The environment is a file, and the file is locked

- **`pyproject.toml` is the only build definition.** `[project]` per PEP 621,
  a `[build-system]`, `requires-python` set. No `setup.py`, no
  `requirements*.txt` edited by hand.
- **Development tools go in `[dependency-groups]`** (PEP 735), not in
  `[project.optional-dependencies]`, which is for extras users install.
- **`uv.lock` is committed**, and CI refuses a stale one:

```bash
uv lock --check
uv sync --locked
```

- **A package uses the `src/` layout**, so tests import the installed package
  and not the working directory by accident.
- A deployment that needs a tool-neutral lockfile gets
  `uv export --format pylock.toml` (PEP 751).

See [`checklists/packaging-and-locking.md`](checklists/packaging-and-locking.md).

---

## 3. Layers are an import contract, or they are nothing

`from app.infrastructure.db import session` is legal Python in any file. The
only thing that makes it illegal in `app.domain` is a contract:

```toml
[tool.importlinter]
root_packages = ["app"]
include_external_packages = true  # required to forbid third-party packages

[[tool.importlinter.contracts]]
name = "Layers point inwards"
type = "layers"
containers = ["app"]
layers = ["api", "services", "domain"]
exhaustive = true

[[tool.importlinter.contracts]]
name = "Domain imports no framework"
type = "forbidden"
source_modules = ["app.domain"]
forbidden_modules = ["django", "fastapi", "sqlalchemy", "pydantic", "httpx"]
```

```bash
uv run lint-imports
```

`exhaustive = true` makes a new top-level package fail the contract until
somebody places it in a layer. For Django, the apps are the units: an
`independence` contract between apps that must not know each other says so
out loud. Run it in CI, and break it once on a branch to see it fail.

See [`checklists/import-contracts.md`](checklists/import-contracts.md).

---

## 4. The type checker is a gate, not advice

Pick **one** checker and run it strict in CI: `[tool.mypy] strict = true`, or
`[tool.pyright] typeCheckingMode = "strict"`. Two checkers with different
opinions produce a codebase annotated to satisfy neither.

- A library ships `py.typed` (PEP 561), or its users get `Any` for everything.
- A `# type: ignore` carries its error code: `# type: ignore[arg-type]`.
- Ports the domain needs are `typing.Protocol` classes owned by the domain;
  the infrastructure satisfies them structurally without importing them back.
- `Any` in a signature is refused (ruff `ANN401`); `object` plus narrowing is
  the honest spelling.

See [`checklists/typing-gate.md`](checklists/typing-gate.md).

---

## 5. Three kinds of model, and a conversion between each

The most expensive Python design mistake is one class doing three jobs — a
pydantic model that is also the ORM row and also carries the business rules.
Then the API schema, the table and the invariants change together forever.

| Kind   | Lives in          | Built with                            | Job                                   |
| ------ | ----------------- | ------------------------------------- | ------------------------------------- |
| Edge   | `api/`, consumers | pydantic 2, `extra="forbid"`          | Parse untrusted input, shape output   |
| Domain | `domain/`         | `@dataclass(frozen=True, slots=True)` | Hold invariants; imports no framework |
| Row    | `infrastructure/` | Django model / SQLAlchemy mapping     | Persistence only                      |

The **data-model** deliverable is this table filled in for the project, plus
the functions that convert between the kinds. Configuration is an edge too:
`pydantic-settings` reads the environment once at startup and fails if a
required value is missing.

See [`checklists/edge-models.md`](checklists/edge-models.md).

---

## 6. Nothing blocks the event loop

- Blocking I/O in `async def` is refused: ruff `ASYNC210` (HTTP), `ASYNC230`
  (`open`), `ASYNC251` (`time.sleep`). Use the async client, or
  `asyncio.to_thread`.
- **FastAPI:** a path operation that calls blocking code is a plain `def`, which
  FastAPI runs in a threadpool. `async def` around a blocking driver stalls
  every request.
- **Django:** the synchronous ORM raises `SynchronousOnlyOperation` in an async
  context. Use the `a`-prefixed ORM methods or `sync_to_async`, and say which
  in the ADR from §1.
- Concurrent work runs in an `asyncio.TaskGroup`; a bare `create_task` keeps a
  reference (ruff `RUF006`) or the task can be collected mid-flight.
- Every outbound call has a deadline: `async with asyncio.timeout(...)`.

See [`checklists/async-boundaries.md`](checklists/async-boundaries.md).

---

## 7. What you refuse

| Refuse                                                | Because                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| An import across layers "just this once"              | `lint-imports` fails, and it should                    |
| A dependency added without `uv lock`                  | The environment in CI is no longer the one reviewed    |
| `Any` in a public signature, a bare `# type: ignore`  | Switches the checker off exactly where callers need it |
| A mutable default argument (`def f(x=[])`)            | Shared across calls; ruff `B006`                       |
| `except Exception: pass`                              | Hides the failure it was written for; ruff `BLE001`    |
| `datetime.now()` without `tz`                         | A naive time is ambiguous across hosts; ruff `DTZ005`  |
| `raise NewError()` inside `except` without `from err` | Loses the cause from the traceback; ruff `B904`        |
| An import inside a function to dodge a cycle          | Hides the cycle instead of removing it; ruff `PLC0415` |
| `os.environ[...]` outside the settings module         | Configuration read everywhere is validated nowhere     |

---

## 8. What you produce

| Deliverable         | When                                    | What it looks like                                                       |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| ADR                 | Before any of the four decisions in §1  | `docs/decisions/NNNN-*.md`, Consequences and Alternatives filled         |
| Architecture review | On request, or before a layer changes   | `severity · file:line · checklist row · fix`                             |
| C4 diagram          | Context and Container only              | Mermaid in the repository; one container per process (web, worker, beat) |
| Data model          | Before the first endpoint that persists | The §5 table for this project, and where each conversion lives           |
| Dependency audit    | Before adding a runtime dependency      | Its transitive tree (`uv tree`), wheels for the target Pythons, licence  |

## 9. How to run a review

1. `uv lock --check` and read `pyproject.toml` against §2.
2. `uv run lint-imports` — or record that no contract exists; that is the
   first finding.
3. The configured type checker, strict, from a clean environment.
4. `uv run ruff check --select ASYNC,B006,B904,BLE001,DTZ,ANN401,PLC0415,RUF006`.
5. `grep -rn "os.environ\|getenv" src` — every hit outside the settings module
   is a finding.
6. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row does not go in the report.

## 10. Where this expert stops

- **Security** — injection, authentication, secrets, dependency CVEs:
  [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- **Schema design, migrations and pipelines**: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Test strategy**: [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- **Notebooks and model training** — a different shape of project; the
  packaging rules transfer, the layering does not.
