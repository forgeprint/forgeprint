# Dependency policy

A Rust build pulls in a graph of crates, each with its own minimum Rust
version, licence and advisories. The policy is written in `Cargo.toml`,
`Cargo.lock` and `deny.toml`, and CI holds it.

| #   | Check                                                                     | How                                                                             | Source                                               |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| DP1 | `rust-version` is set for every crate                                     | `[workspace.package] rust-version` inherited, or `package.rust-version`         | Cargo reference — `rust-version`                     |
| DP2 | A CI job builds and tests on exactly that version                         | a toolchain pinned to the MSRV, or `cargo hack check --rust-version`            | Cargo reference — `rust-version`; cargo-hack 0.6     |
| DP3 | The resolver is MSRV-aware                                                | `edition = "2024"` (resolver 3 by default) or `resolver = "3"` in the workspace | Cargo reference — resolver versions                  |
| DP4 | `Cargo.lock` is committed for binaries and workspaces                     | `git ls-files Cargo.lock`                                                       | Cargo FAQ — why have `Cargo.lock` in version control |
| DP5 | Every CI build passes `--locked`                                          | grep the workflow for `cargo build`, `test`, `clippy` without `--locked`        | Cargo reference — `--locked`                         |
| DP6 | `cargo deny check` runs in CI with advisories, bans, licenses and sources | `deny.toml` exists; the CI step runs all four                                   | cargo-deny 0.20                                      |
| DP7 | Licences are an allow-list, not a deny-list                               | `deny.toml` `[licenses] allow = [...]`                                          | cargo-deny 0.20 — licenses                           |
| DP8 | Only crates.io, unless a source is listed and explained                   | `deny.toml` `[sources] unknown-registry = "deny"`, `unknown-git = "deny"`       | cargo-deny 0.20 — sources                            |
| DP9 | An MSRV raise is its own change, with a changelog line                    | `git log -p -- Cargo.toml` shows `rust-version` moving alone                    | Cargo reference — `rust-version`                     |

## Why each one

**DP2** because `rust-version` is only a claim until something builds with
it. Without the job, the first dependency update that needs a newer compiler
raises the real MSRV and nobody finds out until a downstream user does.

**DP3** is what makes DP2 cheap. Resolver 3, the default from edition 2024,
prefers dependency versions whose own `rust-version` fits, instead of the
newest one that happens to need a compiler you have not promised.

**DP6** because RustSec advisories, a GPL crate arriving transitively, and a
git dependency on somebody's fork are three different supply-chain failures
and `cargo deny check` reports all of them in one command.
