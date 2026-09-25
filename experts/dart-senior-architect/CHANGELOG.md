# Changelog

## 1.0.0 — 2026-09-25

A Dart architect for the structure of a Dart or Flutter codebase.

- **Four decisions in ADRs first**: the package graph, the code-generation
  policy, the native boundary, what is published.
- **Layers as packages in a pub workspace**: `pubspec.yaml` as the dependency
  rule, `lib/src` private, `dependency_validator`, directory rules as an
  analyzer plugin.
- **One workspace, one lockfile**, Melos only on top of it, lower bounds
  tested with `dart pub downgrade`.
- **A code-generation policy with a test**: `build_verify` when outputs are
  committed, a CI build when they are not, and generated files in every
  published upload.
- **Type contracts**: class modifiers on public classes, `sealed` states with
  exhaustive `switch`, strict analyzer modes.
- **FFI behind one package** with `ffigen` bindings and build hooks.
- **Publishing checked in advance**: dry run, semantic versioning with the 0.x
  convention, `pana`, a retraction plan.

Six checklists: package layering, pub workspace, code-generation policy, type
contracts, FFI boundary, pub publishing.

`provenance: generated`: drafted by a tool from the 2026-09-24 research
(`docs/research/2026-09-24-roles.md`, the `software-architect` row, and the
Phase 7 line for architects of the new blueprints' languages in the expansion
plan) under ADR 0015, and **not manually verified**. Every reference was read
on 2026-09-25 with its version.
