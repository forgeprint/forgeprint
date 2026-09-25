# Changelog — python-library

## 1.0.0 — 2026-09-24

First version, and the catalog's first Python `lib` blueprint.

A typed, publishable Python library on uv 0.12.18 with `uv_build` 0.12.18
pinned as the build backend, mypy 2.3.1 in strict mode, ruff 0.16.8, pytest
9.1.1 with pytest-cov 7.1.0 and doctests, twine 7.0.0, and a lockfile. The
release workflow publishes to PyPI from a tag through trusted publishing: the
build job has read access only, the publish job alone has `id-token: write`,
and no PyPI token is stored anywhere.

**Drafted by a tool** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md)
(`uv` 29.3M downloads a week and `pytest` 174M on PyPI; uv among Octoverse
2025's fastest-growing projects) and the
[expansion plan](../../docs/research/2026-09-24-expansion-plan.md), Phase 4.
Every version was read from PyPI on 2026-09-24. The recipe is **CI-tested and
not manually verified**: nobody has published a package from it, so it is
`tier: community` and `provenance: generated`
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

The recipe proves what ships rather than assuming it: it reads the wheel for
`py.typed` and for anything outside the package and its metadata, installs the
wheel into a throwaway environment and imports from there, and type-checks a
consumer against the wheel alone, expecting the error a typed package produces.

Two things came out of running it rather than describing it:

- **mypy's `files` setting refuses `-c`.** A consumer check run from the
  project directory picked up the project's own `[tool.mypy]` and stopped with
  a usage error. The check passes an empty `--config-file=`, which is also the
  honest setting: a consumer does not have this project's configuration.
- **A copy of the recipe can arrive with blank-line runs collapsed**, which
  leaves one blank line between top-level definitions where the formatter
  wants two. The recipe formats before it lints, so the files it wrote come
  out in the formatter's style either way.

Run on Windows with Python 3.14 and uv 0.12.18 (all 26 steps); CI runs it on
Linux with Python 3.13.

### Planned

- A `__version__` read from the installed metadata, if consumers ask for one.
- Compiled extensions are not planned: they need a different backend and a
  different build matrix, which makes them a different blueprint.
