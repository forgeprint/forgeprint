# Setup

Creates a command-line tool in Rust on clap's derive API, with one error type,
conventional exit codes, and integration tests that run the built binary.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Rust 1.85 or newer through rustup, with the rustfmt and clippy
components. No toolchain file is written: it would make rustup download a
toolchain in the middle of the recipe.

1. Start a binary crate in the current directory: `cargo init --bin --vcs none --edition 2024 --name example`
   Verify: `test -f src/main.rs`

2. Replace `Cargo.toml` with:

   ```toml
   [package]
   name = "example"
   version = "0.1.0"
   edition = "2024"
   # The oldest Rust this builds with. clap 4.6 declares 1.85, and so does the
   # 2024 edition. The msrv job in CI builds with exactly this toolchain, so
   # the number is checked rather than hoped for.
   rust-version = "1.85"
   # `--help` prints this and `--version` prints the version above. Neither is
   # written anywhere else, so neither can drift.
   description = "An example command-line tool."
   # Not a library for crates.io. Delete this line when publishing is a
   # decision somebody made, not the accident of a stray `cargo publish`.
   publish = false

   [dependencies]
   # `=` is an exact pin: `cargo update` cannot move it. Cargo.lock pins what
   # clap pulls in, by checksum.
   clap = { version = "=4.6.7", features = ["derive"] }

   [lints.rust]
   unsafe_code = "forbid"
   ```

   Verify: `grep -q 'rust-version = "1.85"' Cargo.toml`

3. Create `src/error.rs` with:

   ```rust
   //! The one error type. Every failure the tool can report is a variant here,
   //! so `main` has exactly one thing to print and one place to choose the
   //! exit code.

   use std::fmt;
   use std::io;

   #[derive(Debug)]
   pub enum Error {
       /// The name was empty, or only whitespace.
       EmptyName,
       /// Writing the result failed; most often the reader of a pipe has gone.
       Output(io::Error),
   }

   // No `From<io::Error>`: with one, the first `?` on a file read would become
   // "could not write the output". Each variant is built where its cause is
   // known, with `map_err`.

   impl fmt::Display for Error {
       fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
           match self {
               Self::EmptyName => f.write_str("the name is empty"),
               Self::Output(source) => write!(f, "could not write the output: {source}"),
           }
       }
   }

   impl std::error::Error for Error {
       fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
           match self {
               Self::EmptyName => None,
               Self::Output(source) => Some(source),
           }
       }
   }
   ```

   Verify: `test -f src/error.rs`

4. Create `src/greet.rs` with:

   ```rust
   //! What the tool does, with no idea that a command line exists. Keeping the
   //! work out of the parser is what makes it testable without parsing
   //! anything, and what lets it be called from somewhere else later without
   //! dragging clap along.

   use crate::error::Error;

   /// The greeting for `name`, or an error when there is nobody to greet.
   ///
   /// clap guarantees the argument is present; only this function knows what
   /// a valid one is. Validation lives with the work, not with the flags.
   pub fn greet(name: &str, shout: bool) -> Result<String, Error> {
       let name = name.trim();
       if name.is_empty() {
           return Err(Error::EmptyName);
       }

       let line = format!("Hello, {name}.");
       if shout {
           return Ok(line.to_uppercase());
       }
       Ok(line)
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn greets_by_name() {
           assert_eq!(greet("Ada", false).unwrap(), "Hello, Ada.");
       }

       #[test]
       fn shouts_when_asked() {
           assert_eq!(greet("Ada", true).unwrap(), "HELLO, ADA.");
       }

       #[test]
       fn refuses_a_blank_name() {
           assert!(matches!(greet("  ", false), Err(Error::EmptyName)));
       }
   }
   ```

   Verify: `test -f src/greet.rs`

5. Create `src/cli.rs` with:

   ```rust
   //! The command surface, and nothing else: what a user can type, and the
   //! help text for it. The work lives in its own module.

   use clap::{Parser, Subcommand};

   // `version` and `about` with no value read Cargo.toml, so `--version` and
   // the first line of `--help` cannot drift from the package metadata. This
   // is a plain comment on purpose: a doc comment here would become help text.
   #[derive(Debug, Parser)]
   #[command(version, about)]
   pub struct Cli {
       #[command(subcommand)]
       pub command: Commands,
   }

   #[derive(Debug, Subcommand)]
   pub enum Commands {
       /// Greet someone by name.
       Greet {
           /// Who to greet.
           name: String,
           /// In capitals.
           #[arg(long)]
           shout: bool,
       },
   }

   #[cfg(test)]
   mod tests {
       use clap::CommandFactory;

       use super::*;

       // clap checks a definition lazily, and only the path a run takes. This
       // walks the whole tree once: two arguments with one name, a short flag
       // used twice, a default that is not a possible value.
       #[test]
       fn the_command_definition_is_consistent() {
           Cli::command().debug_assert();
       }
   }
   ```

   Verify: `test -f src/cli.rs`

6. Replace `src/main.rs` with:

   ```rust
   //! The only file that touches the real streams and the only place that
   //! decides the exit code.

   mod cli;
   mod error;
   mod greet;

   use std::io::{self, Write};
   use std::process::ExitCode;

   use clap::Parser;

   use crate::cli::{Cli, Commands};
   use crate::error::Error;

   fn main() -> ExitCode {
       // On a usage error clap prints its own message to stderr and exits with
       // status 2; after --help or --version it prints to stdout and exits 0.
       // Those are the conventions scripts already expect, so they are kept.
       let cli = Cli::parse();

       let mut out = io::stdout().lock();
       match run(cli, &mut out) {
           Ok(()) => ExitCode::SUCCESS,
           Err(error) => {
               eprintln!("error: {error}");
               ExitCode::FAILURE
           }
       }
   }

   /// Every subcommand, dispatched. Output goes to `out` rather than through
   /// `println!`, which panics when stdout is closed; here a failed write is
   /// an error with a message and a status.
   fn run(cli: Cli, out: &mut impl Write) -> Result<(), Error> {
       match cli.command {
           Commands::Greet { name, shout } => {
               let line = greet::greet(&name, shout)?;
               writeln!(out, "{line}").map_err(Error::Output)?;
           }
       }
       out.flush().map_err(Error::Output)
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       /// A stdout whose reader has gone away, as when the output is piped
       /// into `head` and `head` has already exited.
       struct ClosedPipe;

       impl Write for ClosedPipe {
           fn write(&mut self, _: &[u8]) -> io::Result<usize> {
               Err(io::ErrorKind::BrokenPipe.into())
           }

           fn flush(&mut self) -> io::Result<()> {
               Ok(())
           }
       }

       #[test]
       fn a_failed_write_is_an_error_rather_than_a_panic() {
           let cli = Cli::parse_from(["example", "greet", "Ada"]);

           let result = run(cli, &mut ClosedPipe);

           assert!(matches!(result, Err(Error::Output(_))));
       }
   }
   ```

   Verify: `grep -q "fn run" src/main.rs`

7. Create `tests/cli.rs` with:

   ```rust
   //! The built binary, run the way a user runs it: real arguments, real
   //! streams, real exit codes. Cargo builds the binary before these tests
   //! and hands them its path, so nothing here guesses where target/ is.

   use std::process::{Command, Output};

   fn run(args: &[&str]) -> Output {
       Command::new(env!("CARGO_BIN_EXE_example"))
           .args(args)
           .output()
           .expect("the binary should start")
   }

   fn text(bytes: &[u8]) -> String {
       String::from_utf8_lossy(bytes).trim_end().to_owned()
   }

   #[test]
   fn greets() {
       let output = run(&["greet", "Ada"]);

       assert_eq!(output.status.code(), Some(0));
       assert_eq!(text(&output.stdout), "Hello, Ada.");
       assert_eq!(text(&output.stderr), "");
   }

   #[test]
   fn shouts_when_asked() {
       let output = run(&["greet", "Ada", "--shout"]);

       assert_eq!(output.status.code(), Some(0));
       assert_eq!(text(&output.stdout), "HELLO, ADA.");
   }

   #[test]
   fn a_blank_name_is_an_error_on_stderr_with_status_1() {
       let output = run(&["greet", " "]);

       assert_eq!(output.status.code(), Some(1));
       assert_eq!(text(&output.stdout), "");
       assert_eq!(text(&output.stderr), "error: the name is empty");
   }

   #[test]
   fn a_missing_argument_is_a_usage_error_with_status_2() {
       // Exit codes are the interface a shell script reads: 2 is clap's status
       // for "called wrongly", kept apart from 1 for "tried and failed".
       let output = run(&["greet"]);

       assert_eq!(output.status.code(), Some(2));
       assert_eq!(text(&output.stdout), "");
       assert!(text(&output.stderr).contains("<NAME>"));
   }

   #[test]
   fn an_unknown_subcommand_is_a_usage_error() {
       let output = run(&["gret", "Ada"]);

       assert_eq!(output.status.code(), Some(2));
   }

   #[test]
   fn version_comes_from_cargo_toml() {
       let output = run(&["--version"]);

       assert_eq!(output.status.code(), Some(0));
       assert_eq!(
           text(&output.stdout),
           format!("example {}", env!("CARGO_PKG_VERSION"))
       );
   }

   #[test]
   fn help_names_the_subcommand_and_the_description_from_cargo_toml() {
       let output = run(&["--help"]);

       assert_eq!(output.status.code(), Some(0));
       assert!(text(&output.stdout).contains(env!("CARGO_PKG_DESCRIPTION")));
       assert!(text(&output.stdout).contains("greet"));
   }
   ```

   Verify: `test -f tests/cli.rs`

8. Create `.gitignore` with:

   ```text
   /target/
   ```

   Verify: `test -f .gitignore`

9. Create `.github/workflows/ci.yml` with:

   ```yaml
   name: ci

   on:
     push:
     pull_request:

   permissions:
     contents: read

   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
           with:
             persist-credentials: false
         # A pinned toolchain, so a new clippy lint arrives as a pull request
         # that moves this number rather than as a red build on a quiet day.
         - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
           with:
             toolchain: '1.98.1'
             components: clippy, rustfmt
         - run: cargo fmt --check
         - run: cargo clippy --locked --all-targets -- -D warnings
         - run: cargo test --locked
         - run: cargo build --release --locked

     # rust-version in Cargo.toml is a promise to everyone who builds this with
     # an older toolchain. This job is what keeps it.
     msrv:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
           with:
             persist-credentials: false
         - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
           with:
             toolchain: '1.85.0'
         - run: cargo test --locked
   ```

   Verify: `test -f .github/workflows/ci.yml`

10. Create `README.md` with:

    ```markdown
    # example

    A command-line tool on clap.

    ## Run it from a checkout

    `cargo run -- greet Ada`, or `cargo build --release` and then
    `target/release/example --help`.

    ## Exit codes

    0 when it worked, 1 when it tried and failed (the message is on stderr),
    2 when it was called wrongly (clap's usage message is on stderr).

    ## Add a command

    See `AGENTS.md`. The short version: the work goes in its own module and
    returns the one error type, the subcommand is a variant of `Commands`, and
    the test runs the built binary rather than calling the function.
    ```

    Verify: `test -f README.md`

11. Resolve the dependencies and write the lock file, which is committed: `cargo generate-lockfile`
    Verify: `grep -qx 'version = "4.6.7"' Cargo.lock`

12. Check the formatting: `cargo fmt --check`
    Verify: `cargo fmt --check`

13. Check it for the mistakes the compiler allows, with warnings as errors: `cargo clippy --locked --all-targets -- -D warnings`
    Verify: `cargo clippy --locked --all-targets -- -D warnings`

14. Run the unit and integration tests against the lock file: `cargo test --locked`
    Verify: `cargo test --locked`

15. Build the optimised binary, which is the build proof: `cargo build --release --locked`
    Verify: `test -f target/release/example -o -f target/release/example.exe`

16. Run the tool the way a user would, and read what it printed: `cargo run --release --quiet --locked -- greet Ada --shout > greeted.txt`
    Verify: `grep -qx "HELLO, ADA." greeted.txt`

17. Confirm the version comes from Cargo.toml: `cargo run --release --quiet --locked -- --version > version.txt`
    Verify: `grep -qx "example 0.1.0" version.txt`

18. Confirm the help carries the description from Cargo.toml and exits zero. A reader sees the help first, and so does every script that checks the status code: `cargo run --release --quiet --locked -- --help > help.txt`
    Verify: `grep -q "An example command-line tool." help.txt`

19. Confirm a call with a missing argument is a usage error, status 2: `cargo run --release --quiet --locked -- greet > bad.txt 2>&1; echo "$?" > bad.code`
    Verify: `grep -qx '2' bad.code`

20. Confirm a blank name fails with status 1 and says why on stderr: `cargo run --release --quiet --locked -- greet " " > blank.txt 2> blank.err; echo "$?" > blank.code`
    Verify: `grep -qx '1' blank.code && grep -qx "error: the name is empty" blank.err`
