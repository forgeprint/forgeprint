# Unsafe policy

`unsafe` is where Rust's guarantees become the author's responsibility. The
policy is that it is absent by default, and where it exists, every block
states the invariant a reviewer has to check.

| #   | Check                                                                          | How                                                                       | Source                                      |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| US1 | `unsafe_code = "forbid"` for the workspace                                     | `[workspace.lints.rust]`, or `#![forbid(unsafe_code)]` in each crate root | rustc lint listing — `unsafe_code`          |
| US2 | A crate that allows `unsafe` says why, and names the ADR                       | its own `[lints]` table with a comment; the ADR exists                    | Cargo reference — `[lints]`                 |
| US3 | In that crate, every `unsafe` block has a `// SAFETY:` comment                 | `clippy::undocumented_unsafe_blocks = "deny"` in its lint table           | Clippy — `undocumented_unsafe_blocks`       |
| US4 | One unsafe operation per block                                                 | `clippy::multiple_unsafe_ops_per_block = "deny"`                          | Clippy — `multiple_unsafe_ops_per_block`    |
| US5 | Every `unsafe fn` documents its preconditions in a `# Safety` section          | `clippy::missing_safety_doc` (on by default) passes                       | Clippy — `missing_safety_doc`; Rustonomicon |
| US6 | The unsafe code sits behind a safe API in the smallest module that can hold it | read the module; no `unsafe` in callers                                   | Rustonomicon — working with unsafe          |
| US7 | The module's tests run under Miri in CI                                        | `cargo +nightly miri test -p <crate>` step                                | Miri                                        |
| US8 | New dependencies' `unsafe` use is measured in the dependency audit             | `cargo geiger` output attached to the audit                               | cargo-geiger 0.13                           |

## Why each one

**US1** uses `forbid`, not `deny`, on purpose: `deny` can be overridden by an
`#[allow(unsafe_code)]` anywhere in the source, `forbid` cannot. The only way
round it is a visible change to a crate's `Cargo.toml`, which is where US2
wants the decision to be.

**US3** because the correctness of an `unsafe` block rests on an invariant
the compiler does not check — that a pointer is aligned, that a length is in
bounds. A block with no `SAFETY:` comment asks the reviewer to reconstruct the
invariant; a block with one lets them check it.

**US7** because Miri detects undefined behaviour — out-of-bounds access,
use-after-free, invalid aliasing — that tests on real hardware usually pass.
It is slow, which is why it runs on the one module that needs it.
