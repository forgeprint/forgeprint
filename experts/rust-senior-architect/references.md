# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Crate versions were read from crates.io and the toolchain from the
Rust stable release channel on the date shown. **Re-check every 90 days**;
Rust ships a stable release every six weeks, so the target line in SKILL.md
moves between re-checks and the rules do not.

> **Next re-check due: 2026-12-24.**

## Language and toolchain

| Reference                                                                                                           | Version                         | Checked    | Used for                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| [Rust release channel — stable](https://static.rust-lang.org/dist/channel-rust-stable.toml)                         | rustc 1.98.1 (2026-09-01)       | 2026-09-25 | The target in SKILL.md                                                              |
| [Rust edition guide — Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/index.html)                      | edition 2024, stable since 1.85 | 2026-09-25 | SKILL.md §1 decision 4; DP3                                                         |
| [rustc lint listing](https://doc.rust-lang.org/rustc/lints/listing/index.html)                                      | 1.98                            | 2026-09-25 | PS1 `unreachable_pub`, PS2 `missing_docs`, US1 `unsafe_code`                        |
| [Rust reference — visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html)          | 1.98                            | 2026-09-25 | PS3                                                                                 |
| [Rust reference — `non_exhaustive`](https://doc.rust-lang.org/reference/attributes/type_system.html)                | 1.98                            | 2026-09-25 | PS4                                                                                 |
| [Rust std — `std::error::Error`](https://doc.rust-lang.org/std/error/trait.Error.html)                              | 1.98                            | 2026-09-25 | ET5                                                                                 |
| [The Rust Programming Language — ch. 9, error handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) | 1.98 edition of the book        | 2026-09-25 | ET7                                                                                 |
| [Rust API guidelines](https://rust-lang.github.io/api-guidelines/checklist.html)                                    | current at check                | 2026-09-25 | PS4, PS6 (C-COMMON-TRAITS, C-SEND-SYNC), PS7 (C-STABLE), ET1, ET3, ET4 (C-GOOD-ERR) |
| [The Rustonomicon](https://doc.rust-lang.org/nomicon/)                                                              | current at check                | 2026-09-25 | US5, US6                                                                            |
| [Miri](https://github.com/rust-lang/miri)                                                                           | nightly component               | 2026-09-25 | SKILL.md §7; US7                                                                    |

## Cargo

| Reference                                                                                                | Version    | Checked    | Used for                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ---------------------------------------------------------------------------- |
| [Cargo reference — workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)                | Cargo 1.98 | 2026-09-25 | SKILL.md §2; CB1, CB4, CB5 — `[workspace.dependencies]`, `[workspace.lints]` |
| [Cargo reference — `[lints]`](https://doc.rust-lang.org/cargo/reference/manifest.html#the-lints-section) | Cargo 1.98 | 2026-09-25 | US2 — a member's own table instead of `workspace = true`                     |
| [Cargo reference — `rust-version`](https://doc.rust-lang.org/cargo/reference/rust-version.html)          | Cargo 1.98 | 2026-09-25 | SKILL.md §6; DP1, DP2, DP9                                                   |
| [Cargo reference — resolver versions](https://doc.rust-lang.org/cargo/reference/resolver.html)           | Cargo 1.98 | 2026-09-25 | DP3 — resolver 3 defaults `incompatible-rust-versions` to `fallback`         |
| [Cargo reference — features](https://doc.rust-lang.org/cargo/reference/features.html)                    | Cargo 1.98 | 2026-09-25 | SKILL.md §5; FF1, FF2, FF4–FF6                                               |
| [Cargo — `cargo tree`](https://doc.rust-lang.org/cargo/commands/cargo-tree.html)                         | Cargo 1.98 | 2026-09-25 | SKILL.md §2; CB2                                                             |
| [Cargo — `--locked`](https://doc.rust-lang.org/cargo/commands/cargo-build.html)                          | Cargo 1.98 | 2026-09-25 | DP5                                                                          |
| [Cargo FAQ — `Cargo.lock` in version control](https://doc.rust-lang.org/cargo/faq.html)                  | Cargo 1.98 | 2026-09-25 | DP4                                                                          |

## Tools

| Reference                                                                 | Version                          | Checked    | Used for                                                        |
| ------------------------------------------------------------------------- | -------------------------------- | ---------- | --------------------------------------------------------------- |
| [Clippy lints](https://rust-lang.github.io/rust-clippy/stable/index.html) | 1.98                             | 2026-09-25 | CB6; ET6 `unwrap_used`/`expect_used`; US3–US5                   |
| [cargo-deny](https://embarkstudios.github.io/cargo-deny/)                 | 0.20.2                           | 2026-09-25 | SKILL.md §6; DP6–DP8 — advisories, bans, licenses, sources      |
| [cargo-hack](https://github.com/taiki-e/cargo-hack)                       | 0.6.45                           | 2026-09-25 | SKILL.md §5, §6; FF3 `--feature-powerset`; DP2 `--rust-version` |
| [cargo-semver-checks](https://github.com/obi1kenobi/cargo-semver-checks)  | 0.50.0                           | 2026-09-25 | SKILL.md §3; PS5                                                |
| [cargo-geiger](https://github.com/geiger-rs/cargo-geiger)                 | 0.13.0 (last release 2025-08-31) | 2026-09-25 | SKILL.md §7; US8 — a measurement, not a gate                    |

## Crates

| Reference                                                                                     | Version | Checked    | Used for                                                |
| --------------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------- |
| [thiserror](https://github.com/dtolnay/thiserror)                                             | 2.0.21  | 2026-09-25 | SKILL.md §4; ET1, ET5                                   |
| [anyhow — comparison to thiserror](https://github.com/dtolnay/anyhow#comparison-to-thiserror) | 1.0.104 | 2026-09-25 | SKILL.md §4; ET2 — "use thiserror if you are a library" |
| [Tokio — `#[tokio::main]` and `spawn_blocking`](https://docs.rs/tokio/latest/tokio/)          | 1.53.1  | 2026-09-25 | SKILL.md §1 decision 3; CB3, CB7                        |
| [axum — error handling](https://docs.rs/axum/latest/axum/error_handling/index.html)           | 0.8.9   | 2026-09-25 | ET7 — `IntoResponse` as the one mapping                 |
| [clap](https://docs.rs/clap/latest/clap/)                                                     | 4.6.7   | 2026-09-25 | CB2 — named as a binary-only dependency                 |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-25 | SKILL.md §1; Alternatives is this catalog's addition |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-25 | SKILL.md §9 — Context and Container only             |

## Deferred to elsewhere

- Authentication, input handling, cryptography and secrets:
  [`docs/review-standards.md`](../../docs/review-standards.md) and
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Benchmarks and profiling: [`performance-engineer`](../performance-engineer/SKILL.md).
- Images, cross-compilation, release signing and supply chain beyond
  `cargo deny`: the SLSA and NIST SSDF rows in `docs/review-standards.md`, and
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
