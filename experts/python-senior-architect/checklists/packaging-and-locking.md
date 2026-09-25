# Packaging and locking

A Python project's architecture starts with what gets installed. If two
machines can resolve different versions from the same repository, nothing
downstream of that — tests, type checks, import contracts — is checking the
same program.

| #   | Check                                                                                | How                                                                      | Source                                                     |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| PK1 | `pyproject.toml` has a `[project]` table and a `[build-system]` table                | read the file                                                            | PyPA — pyproject.toml specification                        |
| PK2 | No `setup.py`, `setup.cfg` or hand-edited `requirements*.txt` defines the build      | `ls setup.py setup.cfg requirements*.txt`                                | PyPA — pyproject.toml specification                        |
| PK3 | `requires-python` is set, and CI runs every minor version it admits                  | compare the specifier with the CI matrix                                 | PyPA — pyproject.toml specification; Python release status |
| PK4 | Development tools are in `[dependency-groups]`, not in optional dependencies         | read the tables                                                          | PyPA — dependency groups (PEP 735)                         |
| PK5 | `uv.lock` is committed and CI fails when it is stale                                 | `git ls-files uv.lock`; CI runs `uv lock --check` and `uv sync --locked` | uv 0.12 — locking and syncing                              |
| PK6 | A distributable package uses the `src/` layout                                       | `ls src/<package>/__init__.py`                                           | PyPA — src layout vs flat layout                           |
| PK7 | A typed library ships `py.typed`                                                     | `ls src/<package>/py.typed`                                              | PEP 561                                                    |
| PK8 | A tool-neutral lock, where one is needed, is exported rather than hand-written       | `uv export --format pylock.toml` in the release script                   | PyPA — pylock.toml specification (PEP 751)                 |
| PK9 | Runtime dependencies carry lower bounds, not exact pins; the lockfile holds the pins | read `[project].dependencies`                                            | uv 0.12 — dependency specifiers                            |

## Why each one

**PK5** is the row the others depend on. `uv sync --locked` refuses to run if
`pyproject.toml` and `uv.lock` disagree, so the environment CI tests is the one
the lockfile describes — and the lockfile is what the review saw.

**PK6** prevents the quietest packaging bug in Python: with a flat layout,
tests import the package from the working directory, so a file missing from
the built wheel still passes every test and fails only after install.

**PK9** is the library-versus-application line. Exact pins in `dependencies`
make a library uninstallable beside anything else; no lockfile makes an
application unreproducible. Both halves are needed, in different files.
