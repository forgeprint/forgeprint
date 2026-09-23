# Changelog — node-cli

## 1.0.0 — 2026-09-23

First version, and the catalog's first `cli` blueprint.

A TypeScript command-line tool on Commander 15, layered so that the work, the
flags and the streams are three separate things, with tests that drive the real
parser rather than the function behind it.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where `cli`
was the emptiest `project_type` and `commander` — 375M downloads a week — was
the most-installed package in the whole research. Its recipe runs in CI like
every other and nobody has built a tool on it, so it is `tier: community` and
says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Two things came out of building it rather than describing it. TypeScript 7 no
longer picks up `@types/node` implicitly, so `"types": ["node"]` is spelled out
in the tsconfig. And `exitOverride()` has its own test, because without it a
parse error calls `process.exit` and takes the test runner down with it.
