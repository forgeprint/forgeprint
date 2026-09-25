# Changelog

## 1.0.0 — 2026-09-25

The catalog's Rust architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: the crate layout, the error
  strategy per crate, the async runtime (or none), and the MSRV with the
  edition.
- Crates as the boundaries: a Cargo workspace whose domain crate depends on
  no runtime, no web framework and no database driver — proved by
  `cargo tree`, not by folder names.
- A public surface the compiler holds: `[workspace.lints]` with
  `missing_docs` and `unreachable_pub`, `#[non_exhaustive]` on public enums,
  `cargo semver-checks` before a library release.
- Errors typed where somebody matches on them: `thiserror` 2 (or a
  hand-written enum) in libraries, `anyhow` only in a binary's `main`.
- Features that only add: checked with `cargo hack --feature-powerset`.
- MSRV as a promise: `rust-version`, resolver 3, and a CI job on exactly that
  toolchain; `Cargo.lock` committed for binaries; `cargo deny check` for
  advisories, licences, bans and sources.
- `unsafe_code = "forbid"` by default; where it is allowed, every block has a
  `// SAFETY:` comment that Clippy checks.
- Ten refusals and six checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule, and
aligned with the open `rust-cli` blueprint. Every version was read from
crates.io, the Rust release channel or the tool's own documentation on
2026-09-25. The expert has not been manually verified against a real project
— `provenance: generated` says so (ADR 0011).
