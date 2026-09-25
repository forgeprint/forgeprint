# Rust CLI — agent context

A command-line tool on clap's derive API. Read this before adding a command.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/greet.rs     the work, with no idea a command line exists
src/error.rs     Error: the one error type, every failure a variant
src/cli.rs       Cli and Commands: the derive structs, and nothing else
src/main.rs      parse, run, print the error, choose the exit code
tests/cli.rs     the built binary, run as a subprocess
Cargo.lock       committed: this is a binary, and the lock file is the build
```

## Rules that are not style preferences

**Three exit codes, and they mean different things.** 0: it worked. 1: it
tried and failed, and `main` printed `error: <message>` to stderr. 2: it was
called wrongly, and clap printed the usage message to stderr. A script tells
"retry" from "fix the call" by this number, so do not call
`std::process::exit` anywhere else and do not map a usage error to 1.

**Every failure is a variant of `Error`.** Not `Box<dyn Error>`, not a
`String`, not `anyhow`. One enum means `main` has one thing to print, and a new
failure is a compile error in the `Display` match until somebody writes its
message. Add a variant with the context the message needs — a path, a value —
and build it with `map_err` where the cause is known.

**There is no `From<io::Error>` for `Error`, on purpose.** With one, the first
`?` on a file read would turn into "could not write the output". An
`io::Error` alone does not say which file or which operation; the variant has
to.

**Output goes through the `out` writer, never `println!`.** `println!` panics
when stdout is closed — `example greet Ada | head -0` — and a panic is exit
code 101 with a backtrace hint instead of a message. `writeln!` into `out`
returns the error, and the unit test in `src/main.rs` proves it. Diagnostics
and progress go to stderr with `eprintln!`, so `example ... > file` contains
only the answer.

**No `unwrap`, `expect` or `panic!` outside tests.** A panic is exit code 101,
which is not one of the three above. `unsafe_code` is `forbid` in
`Cargo.toml`; a tool like this has no reason to need it.

**Validation lives with the work, not with the flags.** clap guarantees an
argument is present and of the declared type. What counts as a valid one —
not blank, an existing path, a number in range — is checked by the function
that uses it, and returns an `Error` variant.

**`--version` and the first line of `--help` come from `Cargo.toml`.**
`#[command(version, about)]` with no values reads the package version and
description. Do not write either string into the code, and do not put a doc
comment on `Cli`: it would compete with `about`.

**Dependencies are exact pins, and `Cargo.lock` is committed.** `=4.6.7` so
`cargo update` cannot move clap; the lock file pins everything under it by
checksum. Every build command takes `--locked`, which fails instead of quietly
rewriting the lock file. Read the lock file diff of any dependency change; it
is the supply chain.

**`rust-version` is a promise, and CI keeps it.** The `msrv` job builds with
exactly 1.85. Raise the number in `Cargo.toml` and in that job together, and
only when a dependency or a language feature needs it.

## Commands

```
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo build --release --locked
cargo run -- greet Ada --shout
```

## Adding a command

1. Write the work as a plain function in its own module under `src/`,
   returning `Result<_, Error>`. Add an `Error` variant for each new way it
   can fail, and its message in the `Display` match.
2. Add a variant to `Commands` in `src/cli.rs`, with a doc comment on the
   variant and on every field — that is the help text.
3. Add its arm to the `match` in `run`, writing through `out`.
4. Add a test to `tests/cli.rs` that runs the binary: the output, the status
   code, and what lands on stderr for a bad value. A test that calls the
   function passes while the flag is misspelled in the derive.

## What this does not do

No configuration file or environment variables, no logging crate, no shell
completion, no cross-compilation, no release workflow, no signed or checksummed
artefacts, no `cargo install` from a registry (`publish = false`). Each is a
decision a real tool makes once it knows what it is.

The package and binary are called `example`. Rename both in `Cargo.toml`, the
`CARGO_BIN_EXE_example` in `tests/cli.rs`, and the expected `--version` line,
before anybody depends on the name.
