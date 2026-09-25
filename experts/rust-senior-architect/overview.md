# Rust Senior Software Architect

## What it changes

An agent writing Rust without this expert produces code that compiles, which
in Rust already means a lot. What it does not produce is a design Cargo
holds: one crate where the database driver's types reach the business rules,
`anyhow::Result` returned from a library, a `pub` on every helper, a feature
flag that turns something off, a `rust-version` nothing builds against, and
`.unwrap()` where the error path should be.

This expert moves the design into manifests, lint tables and CI:

- **Four decisions first** — the crate layout, the error strategy per crate,
  the async runtime or none, and the MSRV with the edition.
- **Crates as boundaries** — a domain crate whose `cargo tree` shows no
  runtime, framework or driver; lints and versions declared once for the
  workspace.
- **A public surface the lints hold** — `unreachable_pub`, `missing_docs`,
  `#[non_exhaustive]`, and `cargo semver-checks` before a library release.
- **Typed errors in libraries** — `thiserror` or a hand-written enum with
  context in each variant; `anyhow` only at a binary's edge.
- **Additive features** — every combination built by `cargo hack`.
- **Dependencies on a policy** — a kept MSRV, resolver 3, a committed lock
  with `--locked`, and `cargo deny` for advisories, licences, bans and
  sources.
- **`unsafe` forbidden by default**, and where allowed, a `SAFETY:` comment
  on every block that Clippy enforces.

## What it fits

- Starting an axum service or a clap CLI on Rust 1.98 and edition 2024.
- Reviewing a crate layout, or a change that adds a dependency, a feature, a
  public item or an `unsafe` block.
- Preparing a library release — the semver check and the public-surface
  checklist.
- Raising the MSRV or moving editions — the migration-plan deliverable.
- The open `rust-cli` blueprint (#125): the expert and the recipe agree —
  exact pins, a committed lock, `--locked`, `rust-version` kept by a CI job,
  `unsafe_code` forbidden, one error enum.

## What it does not fit

- **Embedded and `no_std`.** The crate, feature and unsafe rules transfer; the
  runtime, panic and allocation rules are different there.
- **Application security** — what the code accepts and how it authenticates:
  `security-reviewer` and `docs/review-standards.md`.
- **Performance work** — allocation profiles, benchmarks, `perf`:
  `performance-engineer`.
- **Build pipelines, cross-compilation and release signing** —
  `devops-platform-engineer`.
- **A single-file script or a prototype.** One crate and `anyhow` are the
  right answer there, and the expert says so.

## Pros and cons

**In its favour:** almost every rule is enforced by Cargo, rustc or Clippy
once configured, so it survives the conversation. It catches the Rust
failures that compile cleanly — a driver in the domain, `anyhow` in a
library's API, a non-additive feature, an MSRV that drifted.

**Against it:** a workspace, `cargo deny`, `cargo hack` and an MSRV job are
real CI time and configuration for a small project. `missing_docs` on an
existing library is a large first pull request. And the stance on `anyhow`
is a line some teams draw differently — the expert allows it at a binary's
edge, and the `rust-cli` blueprint chooses not to use it at all.
