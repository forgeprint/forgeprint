# Import contracts

Any Python module can import any other. The layering exists only if
import-linter says so and CI runs it.

| #   | Check                                                                                          | How                                                 | Source                                      |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| IC1 | import-linter is in the dev dependency group, and `[tool.importlinter]` names the root package | read `pyproject.toml`                               | import-linter 2.15 — configuration          |
| IC2 | A `layers` contract lists the layers from outermost to innermost                               | read the contract                                   | import-linter 2.15 — layers contracts       |
| IC3 | The layers contract is `exhaustive`, so a new top-level package must be placed                 | `exhaustive = true` in the contract                 | import-linter 2.15 — layers contracts       |
| IC4 | A `forbidden` contract keeps web frameworks, ORMs and HTTP clients out of the domain           | `include_external_packages = true` and the contract | import-linter 2.15 — forbidden contracts    |
| IC5 | Django apps that must not know each other are held apart by an `independence` contract         | read the contract; compare with `INSTALLED_APPS`    | import-linter 2.15 — independence contracts |
| IC6 | Every `ignore_imports` entry has a comment naming why and when it goes                         | read the contract                                   | import-linter 2.15 — layers contracts       |
| IC7 | `uv run lint-imports` runs in CI, and a planted violation turns it red                         | read the CI script; break a contract on a branch    | import-linter 2.15 — CLI                    |
| IC8 | No import inside a function body to get around a cycle                                         | `ruff check --select PLC0415`; read each hit        | ruff 0.16 — `import-outside-top-level`      |
| IC9 | Absolute imports across packages; no `from ...` climbing out of a package                      | `ruff check --select TID252`                        | ruff 0.16 — `relative-imports`              |

## Why each one

**IC3** turns the contract from a description into a gate. Without
`exhaustive`, a new package `app/reports/` sits outside every layer and may
import anything — which is exactly where the next boundary violation goes.

**IC4** needs `include_external_packages`, and the reason is worth knowing:
import-linter builds its graph from the root package only, so a contract that
forbids `sqlalchemy` without that option is checking a module it never sees,
and passes.

**IC8** because a local import is how a cycle is hidden rather than removed.
The cycle is still there; it has only moved from import time to the first call
that takes that path.
