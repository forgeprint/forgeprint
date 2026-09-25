# Crate boundaries

In Rust the unit the compiler and Cargo reason about is the crate. A module
boundary inside one crate is visibility at best; a crate boundary is a
dependency edge that cannot form a cycle and that `cargo tree` can print.

| #   | Check                                                                                  | How                                                                                          | Source                                     |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| CB1 | The crate layout is recorded: single crate, or a workspace with named roles per member | the ADR; `[workspace] members` in the root `Cargo.toml`                                      | Cargo reference — workspaces               |
| CB2 | The domain crate depends on no runtime, web framework, database driver or CLI parser   | `cargo tree -p <domain> -e normal` lists no `tokio`, `axum`, `sqlx`, `reqwest`, `clap`       | Cargo reference — `cargo tree`             |
| CB3 | Only the binary crate (and adapter crates) names the async runtime                     | `grep -rln "tokio::main\|Runtime::new" --include=*.rs` lists only binary sources             | Tokio 1.53 — `#[tokio::main]`              |
| CB4 | Shared dependency versions are declared once in `[workspace.dependencies]`             | members use `dep.workspace = true`; no member pins a different version                       | Cargo reference — workspaces: dependencies |
| CB5 | Lints are declared once in `[workspace.lints]` and every member inherits them          | each member `Cargo.toml` has `[lints] workspace = true`, or its own table with a reason      | Cargo reference — workspaces: lints        |
| CB6 | Clippy runs over the whole workspace with warnings as errors                           | CI runs `cargo clippy --workspace --all-targets --locked -- -D warnings`                     | Clippy — usage                             |
| CB7 | Blocking work in async code is moved off the runtime                                   | `grep -rn "std::thread::sleep\|std::fs::" ` inside `async fn`; `spawn_blocking` where needed | Tokio 1.53 — `spawn_blocking`              |

## Why each one

**CB2** is the rule the crate split exists for. A domain crate that depends
on `sqlx` compiles its rules against a database driver's types; the day the
driver changes, so does the domain. `cargo tree` shows the edge in one
command, before anybody reads the code.

**CB3** because a library that starts its own runtime cannot be called from
inside another one — Tokio panics when a runtime is started from within a
runtime. The binary chooses the runtime once and everything below it is
`async fn`.

**CB7** because a blocking call inside an `async fn` stalls every task on that
worker thread. It compiles, it passes tests with one request, and it shows up
as latency under load.
