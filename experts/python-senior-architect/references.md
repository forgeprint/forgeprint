# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Tool versions were read from PyPI on the date shown. **Re-check every
90 days**, and when Python 3.15 is released (scheduled for October 2026) —
that moves the target in SKILL.md and PK3.

> **Next re-check due: 2026-12-23.**

## Language

| Reference                                                                                                    | Version                                                    | Checked    | Used for                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| [Python release status](https://devguide.python.org/versions/)                                               | 3.14.7 current (bugfix to 2027-10); 3.13 bugfix to 2026-10 | 2026-09-24 | The target in SKILL.md; PK3                                                  |
| [What's new in Python 3.14](https://docs.python.org/3.14/whatsnew/3.14.html)                                 | 3.14                                                       | 2026-09-24 | Deferred annotations (PEP 649), free-threaded build support (PEP 779)        |
| [Python 3.14 — Developing with asyncio](https://docs.python.org/3.14/library/asyncio-dev.html)               | 3.14                                                       | 2026-09-24 | AS1, AS9 — debug mode, slow-callback reporting, running blocking code        |
| [Python 3.14 — Coroutines and Tasks](https://docs.python.org/3.14/library/asyncio-task.html)                 | 3.14                                                       | 2026-09-24 | AS3, AS6–AS8 — `TaskGroup`, `create_task` references, `timeout`, `to_thread` |
| [Python 3.14 — `dataclasses`](https://docs.python.org/3.14/library/dataclasses.html)                         | 3.14                                                       | 2026-09-24 | EM3, EM4 — `frozen`, `slots`                                                 |
| [Python 3.14 — `typing`](https://docs.python.org/3.14/library/typing.html)                                   | 3.14                                                       | 2026-09-24 | TY6 — `Protocol`                                                             |
| [Python 3.14 — `datetime`](https://docs.python.org/3.14/library/datetime.html)                               | 3.14                                                       | 2026-09-24 | EM9 — aware and naive objects                                                |
| [Python tutorial — exception chaining](https://docs.python.org/3.14/tutorial/errors.html#exception-chaining) | 3.14                                                       | 2026-09-24 | SKILL.md §7 — `raise ... from err`                                           |
| [PEP 544 — Protocols](https://peps.python.org/pep-0544/)                                                     | Final                                                      | 2026-09-24 | TY6 — structural subtyping for ports                                         |
| [PEP 561 — Distributing type information](https://peps.python.org/pep-0561/)                                 | Final                                                      | 2026-09-24 | PK7, TY7 — `py.typed`                                                        |

## Packaging

| Reference                                                                                                         | Version                         | Checked    | Used for                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| [PyPA — pyproject.toml specification](https://packaging.python.org/en/latest/specifications/pyproject-toml/)      | current (PEP 621 lineage)       | 2026-09-24 | SKILL.md §2; PK1–PK3                                                               |
| [PyPA — Dependency groups](https://packaging.python.org/en/latest/specifications/dependency-groups/)              | current (PEP 735)               | 2026-09-24 | PK4                                                                                |
| [PyPA — pylock.toml specification](https://packaging.python.org/en/latest/specifications/pylock-toml/)            | current (PEP 751)               | 2026-09-24 | PK8                                                                                |
| [PyPA — src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) | current at check                | 2026-09-24 | PK6                                                                                |
| [uv — locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/)                                     | uv 0.12.18, released 2026-09-22 | 2026-09-24 | PK5, PK8 — `uv lock --check`, `uv sync --locked`, `uv export --format pylock.toml` |
| [uv — managing dependencies](https://docs.astral.sh/uv/concepts/projects/dependencies/)                           | uv 0.12.18                      | 2026-09-24 | PK9, and `uv tree` for the dependency audit in SKILL.md §8                         |

## Tools that enforce the rules

| Reference                                                                                                             | Version                        | Checked    | Used for                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [import-linter](https://import-linter.readthedocs.io/en/stable/)                                                      | 2.15, released 2026-09-04      | 2026-09-24 | SKILL.md §3; IC1, IC7 — configuration and `lint-imports`                                                                                                       |
| [import-linter — layers contracts](https://import-linter.readthedocs.io/en/stable/contract_types/layers/)             | 2.15                           | 2026-09-24 | IC2, IC3, IC6 — `containers`, `exhaustive`, `ignore_imports`                                                                                                   |
| [import-linter — forbidden contracts](https://import-linter.readthedocs.io/en/stable/contract_types/forbidden/)       | 2.15                           | 2026-09-24 | IC4, EM3 — `include_external_packages`                                                                                                                         |
| [import-linter — independence contracts](https://import-linter.readthedocs.io/en/stable/contract_types/independence/) | 2.15                           | 2026-09-24 | IC5                                                                                                                                                            |
| [mypy — changelog](https://mypy.readthedocs.io/en/stable/changelog.html)                                              | 2.3.1; 2.0 released 2026-05-06 | 2026-09-24 | TY1, TY8 — mypy 2 no longer targets Python 3.9                                                                                                                 |
| [mypy — configuration file](https://mypy.readthedocs.io/en/stable/config_file.html)                                   | 2.3.1                          | 2026-09-24 | TY2, TY3 — `strict`, per-module overrides                                                                                                                      |
| [mypy — error codes](https://mypy.readthedocs.io/en/stable/error_codes.html)                                          | 2.3.1                          | 2026-09-24 | TY4 — coded ignores, `ignore-without-code`                                                                                                                     |
| [pyright — configuration](https://github.com/microsoft/pyright/blob/main/docs/configuration.md)                       | 1.1.414                        | 2026-09-24 | TY1, TY2 — `typeCheckingMode = "strict"`                                                                                                                       |
| [ruff — rules](https://docs.astral.sh/ruff/rules/)                                                                    | 0.16.8, released 2026-09-16    | 2026-09-24 | IC8 (`PLC0415`), IC9 (`TID252`), TY5 (`ANN401`), AS2 (`ASYNC210`, `ASYNC230`, `ASYNC251`), AS7 (`RUF006`), EM9 (`DTZ`), SKILL.md §7 (`B006`, `B904`, `BLE001`) |

## Frameworks and libraries

| Reference                                                                                    | Version         | Checked    | Used for                                                  |
| -------------------------------------------------------------------------------------------- | --------------- | ---------- | --------------------------------------------------------- |
| [FastAPI — Concurrency and async / await](https://fastapi.tiangolo.com/async/)               | FastAPI 0.141.1 | 2026-09-24 | AS4 — `def` runs in a threadpool, `async def` on the loop |
| [Django — Asynchronous support](https://docs.djangoproject.com/en/6.1/topics/async/)         | Django 6.1.1    | 2026-09-24 | AS5 — `SynchronousOnlyOperation`, `sync_to_async`         |
| [Django — Models](https://docs.djangoproject.com/en/6.1/topics/db/models/)                   | Django 6.1.1    | 2026-09-24 | EM5                                                       |
| [SQLAlchemy — ORM mapping styles](https://docs.sqlalchemy.org/en/20/orm/mapping_styles.html) | 2.0.54          | 2026-09-24 | EM5 — declarative and imperative mapping                  |
| [pydantic — Models](https://docs.pydantic.dev/latest/concepts/models/)                       | 2.13.5          | 2026-09-24 | EM1                                                       |
| [pydantic — Configuration](https://docs.pydantic.dev/latest/api/config/)                     | 2.13.5          | 2026-09-24 | EM2 — `extra`, and its default of ignoring unknown fields |
| [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)            | 2.15.0          | 2026-09-24 | EM7, EM8                                                  |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ----------------------------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-24 | SKILL.md §1; Alternatives is this catalog's addition                    |
| [Martin Fowler — Data Mapper (PoEAA)](https://martinfowler.com/eaaCatalog/dataMapper.html)                                 | book, 2002       | 2026-09-24 | SKILL.md §5; EM6 — rows and domain objects kept apart by a mapper       |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-24 | SKILL.md §8 — Context and Container diagrams, one container per process |

## Deferred to elsewhere

This expert does **not** restate application security or data engineering.

- Injection, authentication, secrets and dependency vulnerabilities:
  [`docs/review-standards.md`](../../docs/review-standards.md) and
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Schema design, migrations and pipelines:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
