# Changelog

## 1.0.0 — 2026-09-24

The catalog's Python architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: sync or async per process, the layers
  as an import contract, the edge / domain / row model split, and the
  supported Python versions.
- Packaging as architecture: PEP 621 `pyproject.toml`, PEP 735 dependency
  groups, a committed `uv.lock` checked with `uv lock --check` and
  `uv sync --locked`, the `src/` layout, `py.typed`.
- Layers enforced by import-linter 2.15: an exhaustive `layers` contract,
  `forbidden` for frameworks in the domain (with `include_external_packages`),
  `independence` between Django apps.
- One strict type checker as a gate — mypy 2.3 or pyright — with coded ignores
  and `Protocol` ports owned by the domain.
- Three kinds of model and the conversions between them, as the data-model
  deliverable; settings through `pydantic-settings`, validated at startup.
- Async boundaries: flake8-async rules through ruff, FastAPI's `def` versus
  `async def`, Django's async ORM boundary, `TaskGroup`, deadlines.
- Nine refusals and five checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every tool version was read from PyPI or the vendor's documentation on
2026-09-24. The expert has not been manually verified against a real project —
`provenance: generated` says so (ADR 0011).
