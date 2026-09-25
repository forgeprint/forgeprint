# Changelog — rust-cli

## 1.0.0 — 2026-09-25

First version.

A Rust command-line tool on clap 4.6.7's derive API, layered so that the work,
the command surface, the error type and the streams are separate things, with
integration tests that run the built binary.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where `clap` showed 235.9M downloads in 90 days (1.16B in total) on crates.io
and the catalog had no Rust blueprint at all. Its recipe runs in CI like every
other; it was not run by hand, and nobody has built a tool on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions read from crates.io on 2026-09-25: clap 4.6.7, whose declared
`rust-version` is 1.85; every crate it pulls in declares 1.85 or lower, which
is where the blueprint's `rust-version` and `cargo>=1.85` come from. The
recipe itself is tested in CI on one current toolchain; the 1.85 floor is
checked by the `msrv` job in the generated project's own workflow.

Decisions worth arguing about:

- **Three exit codes.** 1 for a failure the tool reports, 2 for a usage error
  as clap already returns it. A script can tell "retry" from "fix the call".
- **No `println!`.** Output goes through a writer, so a closed stdout is an
  error with a message rather than a panic with status 101. A unit test proves
  it.
- **No `From<io::Error>` on the error type**, so a future file read cannot
  borrow the message for a failed write.
- **Standard-library integration tests**, through `CARGO_BIN_EXE_example`,
  rather than `assert_cmd` and `predicates`: two fewer dev-dependencies for
  the same assertions.
- **No `rust-toolchain.toml`**: it would have rustup download a toolchain in
  the middle of the recipe, from a host that is not a package registry.

### Planned

Nothing is promised. A release workflow (cross-compiled binaries, checksums,
provenance) would add `cd` to the requirements and is the obvious next
version if somebody asks for it.
