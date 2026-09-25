# Error types

Rust makes every failure a value. The architecture decides which crate owns
which error type, and whether a caller can still tell one failure from
another by the time it reaches them.

| #   | Check                                                                         | How                                                                                              | Source                                          |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| ET1 | Each library crate exposes its own error enum                                 | read `lib.rs` for `pub enum Error` (or per-module errors); `thiserror` or hand-written           | thiserror 2.0; Rust API guidelines — C-GOOD-ERR |
| ET2 | No `anyhow` in a library crate's dependencies                                 | `grep -n "anyhow" crates/*/Cargo.toml` lists only binary crates                                  | anyhow 1.0 — comparison to thiserror            |
| ET3 | No `Box<dyn Error>` or `anyhow::Error` in a public library signature          | grep public `fn` signatures in library crates                                                    | Rust API guidelines — C-GOOD-ERR                |
| ET4 | Error variants carry the context a caller needs (a path, an id, a value)      | read each variant; a bare `Io(io::Error)` with no path is a finding                              | Rust API guidelines — C-GOOD-ERR                |
| ET5 | Each error implements `std::error::Error` with `source()` for its cause       | `#[source]`/`#[from]` with thiserror, or a hand-written `source()`                               | Rust std — `std::error::Error`; thiserror 2.0   |
| ET6 | No `unwrap`, `expect` or `panic!` in non-test code without a stated invariant | `clippy::unwrap_used` and `clippy::expect_used` warn in the lint table; each allow has a comment | Clippy — `unwrap_used`, `expect_used`           |
| ET7 | The binary maps errors to exit codes or responses in one place                | read `main` (CLI) or the error-to-response impl (axum `IntoResponse`)                            | Rust Book — ch. 9; axum 0.8 — error handling    |

## Why each one

**ET2 and ET3** are the library-and-binary split in two greps. `anyhow` is
built for code where the only thing done with an error is to show it; its own
README says a library that wants callers to get exactly the information it
chooses should use `thiserror`. Once `anyhow::Error` is in a library's API,
every caller is reduced to string matching.

**ET4** is what makes an error message useful at 3am. `No such file or
directory (os error 2)` names no file; the variant has to, because the
`io::Error` does not.

**ET7** because a CLI's exit code and a service's HTTP status are contracts
with somebody else. One mapping, in one place, is testable; `?` sprinkled
through handlers with an implicit `500` for everything is not.
