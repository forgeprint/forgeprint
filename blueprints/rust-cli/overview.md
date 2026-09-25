# Rust CLI

A command-line tool in Rust on clap's derive API, with one error type, exit
codes a script can rely on, and integration tests that run the built binary.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has built a real tool on it first,
which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- A binary crate on the 2024 edition with `rust-version = "1.85"`, clap 4.6.7
  pinned exactly, and a committed `Cargo.lock`.
- One subcommand, `greet NAME [--shout]`, split into the work (`src/greet.rs`),
  the derive structs (`src/cli.rs`), the one error type (`src/error.rs`) and a
  `main` that owns the streams and the exit code.
- Exit codes with a meaning each: 0 worked, 1 tried and failed with a message
  on stderr, 2 called wrongly with clap's usage message on stderr.
- `--help` and `--version` read from `Cargo.toml`, so they cannot drift.
- Unit tests for the work and for a closed stdout, a `debug_assert` over the
  whole command definition, and integration tests that run the compiled binary
  and check stdout, stderr and the status code.
- `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` and
  `cargo build --release` in the recipe, and a CI workflow that runs them on a
  pinned toolchain plus a second job on exactly 1.85, with actions pinned by
  commit SHA.

## Options

None. A second argument parser or a second error strategy would be a second
blueprint, not an option.

## What it fits

- A tool that has to ship as one file with no runtime, where the extra build
  time of Rust buys something: startup in milliseconds, predictable memory, no
  interpreter on the target machine.
- A tool called from shell scripts and CI, where the difference between "failed"
  and "called wrongly" matters and a panic is not an acceptable answer.
- A team that already writes Rust and wants the command surface to be types
  the compiler checks, rather than strings looked up at run time.
- Learning clap without starting from the single-file `main.rs` every example
  uses, which is where error handling and testing usually go missing.

## What it is NOT for

- **Releasing.** No cross-compilation matrix, no `cargo-dist`, no release
  workflow, no checksums, signatures or provenance for artefacts, no
  publishing to crates.io (`publish = false`). A release is a set of decisions,
  and doing it halfway here would be worse than not doing it.
- **Configuration files or environment binding.** Flags and arguments only.
  Precedence between file, environment and flag is a real design question and
  it is not answered here.
- **Interactive or full-screen tools.** No prompts, no colours chosen by the
  tool, no terminal UI. Use a TUI crate and a different shape.
- **A library with a CLI on the side.** There is no `lib.rs`; the work is
  private to the binary. If other crates need the logic, that is a workspace
  with a library crate, and this blueprint does not set one up.
- **The fastest route to a small tool.** If the team does not already write
  Rust, `go-cli` gives the same single-binary result with a much shorter build
  and learning curve, and `python-cli` or `node-cli` are shorter still when a
  runtime on the machine is acceptable.

## Trade-offs made on your behalf

- **clap's derive API rather than its builder API.** The derive turns the
  command line into a struct and an enum, so a new flag is a field the
  compiler makes you handle, and the doc comments are the help text. The cost
  is compile time — the derive pulls in `syn` and a proc macro — and less
  control when arguments depend on each other at run time. The builder API is
  what to reach for when the command set is only known at run time, such as
  plugins discovered on disk; both are the same crate and can be mixed.
- **A hand-written error enum rather than `thiserror` or `anyhow`.** One fewer
  dependency, and the `Display` match is the list of every message the tool
  can print. `thiserror` removes the boilerplate and is a reasonable swap once
  there are many variants; `anyhow` fits applications that only report errors
  and never match on them, which is exactly what this blueprint's exit-code
  rule asks you not to do.
- **Integration tests on `std::process::Command` rather than `assert_cmd` and
  `predicates`.** Cargo already builds the binary and hands its path to the
  tests through `CARGO_BIN_EXE_example`, so the standard library is enough and
  two dev-dependencies (and everything under them) are not in the lock file.
  `assert_cmd` reads better once there are dozens of these.
- **Exact pins in `Cargo.toml`.** `=4.6.7` rather than `4.6.7` (which means
  `^4.6.7`). The lock file already pins the build; the exact requirement also
  stops `cargo update` moving clap without a visible diff to `Cargo.toml`. The
  cost is that security updates to clap are a manual edit.
- **No `rust-toolchain.toml`.** It would pin the toolchain for everyone who
  clones the project, which is useful, and make rustup download that toolchain
  on first use, which the recipe does not allow. CI pins the toolchain in the
  workflow instead, and `rust-version` states the floor.
- **A failed write is an error, not a silent exit.** Piping into `head` prints
  `error: could not write the output: Broken pipe` and exits 1. Some tools
  exit quietly on a broken pipe instead; that is a one-line change in `main`
  and a deliberate one.

## Pros

- **The exit codes are a tested interface.** 0, 1 and 2 are each asserted
  against the real binary, along with what lands on stdout and stderr.
- **Nothing panics on a closed stdout**, and a unit test proves it — the most
  common way a Rust CLI crashes in a pipeline.
- **The supply chain is small and pinned.** One direct dependency, pinned
  exactly; a committed lock file with checksums; `--locked` on every build;
  `unsafe_code` forbidden in the crate.
- **`rust-version` is checked, not declared.** The CI workflow builds on
  exactly 1.85 as well as on a current pinned toolchain.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **Compile times.** A clean build compiles clap and its derive macro; the
  first `cargo test` takes noticeably longer than the Go or Python equivalents.
- **The 1.85 floor is declared by clap and the edition, and checked by the
  generated project's CI** — not by this catalog's recipe test, which runs on
  one current toolchain.
- **One example command.** You are meant to replace `greet`. Nested
  subcommands, global flags and argument groups are clap features this does
  not demonstrate.

## Compared with the alternatives here

- **`go-cli`**, **`python-cli`** and **`node-cli`** — the same layers (the
  work, the command surface, the entry point) on Cobra, Typer and Commander.
  Pick by what the surrounding repository already is. Against `go-cli`, the
  real difference is the type system and the price paid for it in compile
  time; both produce a single binary with no runtime.

## Cost of adoption

About ten minutes once Rust is installed through rustup with the `rustfmt` and
`clippy` components, most of it the first build.
