# Typing gate

Python runs annotations it cannot check. They mean something only when one
type checker, in strict mode, fails the build.

| #   | Check                                                                  | How                                                                                   | Source                                         |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| TY1 | Exactly one type checker is configured and runs in CI                  | `[tool.mypy]` or `[tool.pyright]`, not both as gates                                  | mypy 2.3; pyright 1.1.414                      |
| TY2 | It runs strict: `strict = true`, or `typeCheckingMode = "strict"`      | read the table                                                                        | mypy 2.3 — `--strict`; pyright — configuration |
| TY3 | No module is exempted by an override that turns strictness off         | grep `[[tool.mypy.overrides]]` for `ignore_errors`; pyright `ignore`                  | mypy 2.3 — per-module configuration            |
| TY4 | Every `# type: ignore` names an error code                             | `grep -rn "type: ignore\s*$" src`; mypy `enable_error_code = ["ignore-without-code"]` | mypy 2.3 — error codes                         |
| TY5 | No `Any` in a public signature                                         | `ruff check --select ANN401`                                                          | ruff 0.16 — `any-type`                         |
| TY6 | Domain ports are `typing.Protocol` classes defined in the domain       | read `domain/` for `Protocol`; infrastructure never imported by domain                | PEP 544; Python 3.14 — `typing`                |
| TY7 | A library ships `py.typed`, and its public API is checked from outside | `ls py.typed`; a test imports the package as a user would                             | PEP 561                                        |
| TY8 | The checker targets the lowest supported Python, not the newest        | `python_version` / `pythonVersion` equals `requires-python`'s floor                   | mypy 2.3 — `--python-version`                  |

## Why each one

**TY1** matters more than it looks. mypy and pyright disagree on inference in
real cases; a codebase that has to satisfy both accretes casts and ignores that
serve neither. One checker, strict, is a gate. Two are an argument.

**TY6** is where typing becomes architecture. A `Protocol` lets the domain say
what it needs from storage without importing anything that provides it, so the
import contract and the type checker enforce the same boundary from two sides.

**TY8** because mypy 2 no longer targets 3.9, and a checker set to the newest
Python accepts syntax the oldest supported one rejects.
