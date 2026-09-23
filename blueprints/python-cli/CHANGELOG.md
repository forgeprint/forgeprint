# Changelog — python-cli

## 1.0.0 — 2026-09-23

First version.

A Python command-line tool on Typer 0.27, layered so that the work, the parsing
and the entry point are three separate things, with tests that drive the real
parser through `CliRunner`.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where `cli`
was the emptiest `project_type` and `typer` showed 239M downloads a month. Its
recipe runs in CI like every other and nobody has built a tool on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

One thing came out of building it rather than describing it: a Typer app with
exactly one command **collapses that command to the top level**, so the tool
answers `app Ada` rather than `app greet Ada` — and adding a second command
later silently changes the interface of the first. `@app.callback()` keeps it a
group from the start, and the reason is written where it happens rather than in
a footnote.
