---
name: rust-senior-architect
description: Hold a Rust codebase's architecture with what Cargo and the compiler enforce — a workspace whose domain crate depends on no runtime or framework (proved with cargo tree), workspace lints for missing_docs and unreachable_pub, typed errors with thiserror in libraries and anyhow only at a binary's edge, additive features checked with cargo hack, a rust-version kept by a CI job, Cargo.lock committed for binaries, cargo deny for advisories and licences, and unsafe forbidden unless every block carries a SAFETY comment. Use when starting a Rust service or CLI, reviewing a crate layout, cutting a library release, raising the MSRV, or when an agent is about to add a dependency, a feature, a pub item, an unwrap or an unsafe block.
license: CC-BY-4.0
---

# Working as a senior Rust architect

Rust's compiler already refuses a large class of mistakes, which makes it easy
to believe the architecture is taken care of. It is not. A single crate with
everything `pub`, `anyhow::Result` in a library's API, a feature that removes
a function, a dependency that quietly raised the minimum Rust version — all
compile. The design lives in `Cargo.toml` files and lint tables, and it holds
only where Cargo or the compiler fails the build.

Targets: **Rust 1.98 stable**, **edition 2024**, Cargo resolver 3. Sources:
[`references.md`](references.md).

---

## 1. Decide four things before the first crate

Each is an ADR, `docs/decisions/NNNN-<slug>.md`, with Context, Decision,
Consequences and Alternatives considered:

1. **The crate layout.** One crate is fine for a small CLI. A service gets a
   workspace: a domain crate, adapter crates, and a thin binary.
2. **The error strategy per crate.** Libraries expose a typed error; the
   binary decides how failures become exit codes or HTTP responses.
3. **The async runtime, or none.** Tokio (with axum for HTTP), or synchronous
   code. Only binaries and adapter crates name the runtime.
4. **The MSRV and the edition**, and the rule for raising the MSRV.

Name an open one when code is requested, propose it in a paragraph, build on
the proposal, and record it as `Status: Proposed`.

---

## 2. Crates are the boundaries

A module boundary is a convention; a crate boundary is a dependency edge
Cargo refuses to cycle. Verify the domain crate's graph — run it:

```bash
cargo tree -p app-domain -e normal --depth 1
```

It lists no `tokio`, `axum`, `sqlx`, `reqwest` or `clap`. Adapters depend on
the domain; the binary depends on everything and wires it. Shared versions,
package metadata and lints live once, in the workspace root:

```toml
[workspace.package]
edition = "2024"
rust-version = "1.85"

[workspace.lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"
unreachable_pub = "warn"

[workspace.lints.clippy]
unwrap_used = "warn"
expect_used = "warn"
```

Each member says `[lints] workspace = true`. CI runs
`cargo clippy --workspace --all-targets --locked -- -D warnings`, which turns
every `warn` above into a failure.

See [`checklists/crate-boundaries.md`](checklists/crate-boundaries.md).

---

## 3. The public surface is a decision

- **`pub` is for the crate's API**; everything else is `pub(crate)`.
  `unreachable_pub` reports a `pub` item nobody outside can reach.
- **Every public item is documented** — `missing_docs` in the lint table.
- **Public enums and structs that will grow are `#[non_exhaustive]`**, so a new
  variant is not a breaking change for callers.
- **A library release runs `cargo semver-checks`** against the last published
  version. The version bump follows the report, not the author's belief.

See [`checklists/public-surface.md`](checklists/public-surface.md).

---

## 4. Errors are typed where somebody matches on them

- **A library returns its own error enum** — `thiserror` 2.0 or a
  hand-written `Display` — with the context a caller needs in each variant.
- **`anyhow` belongs in a binary**, at the top, where the only thing done with
  an error is to print it. `anyhow::Error` in a library's public signature is
  refused: the caller can no longer match on what went wrong.
- **No blanket `From<io::Error>`** that erases which file or which operation
  failed; the variant carries the path.
- **No `unwrap`, `expect` or `panic!` outside tests** and documented
  invariants. A panic in a CLI is exit code 101; in a service it is a dropped
  request.

The `rust-cli` blueprint (open pull request #125) takes the stricter line — one
hand-written enum even in the binary, mapped to exit codes 1 and 2 — and
satisfies every row here.

See [`checklists/error-types.md`](checklists/error-types.md).

---

## 5. Features only add

Cargo unifies features across the whole dependency graph. A feature that
removes an item or changes behaviour breaks some other crate that turned it
on for a different reason.

- A feature adds items or implementations; it never removes or changes one.
- `default` features are the minimum that makes sense, not "everything".
- `cargo hack check --feature-powerset --workspace` runs in CI, so no
  combination fails to build.
- Optional dependencies are named with `dep:` so they do not become implicit
  features.

See [`checklists/feature-flags.md`](checklists/feature-flags.md).

---

## 6. Dependencies, MSRV and the lock

- **`rust-version` is set** and a CI job builds and tests on exactly that
  toolchain (or `cargo hack check --rust-version`). Resolver 3 then prefers
  dependency versions that support it.
- **`Cargo.lock` is committed** for every binary and workspace, and CI passes
  `--locked`.
- **`cargo deny check` runs in CI**: advisories (RustSec), licences against an
  allow-list, bans (duplicate versions, forbidden crates), sources (crates.io
  only unless listed).
- A new dependency is a dependency audit (§9), not a line in a diff.

See [`checklists/dependency-policy.md`](checklists/dependency-policy.md).

---

## 7. `unsafe` is forbidden until justified

- `unsafe_code = "forbid"` in the workspace lints. A crate that needs
  `unsafe` declares its own `[lints]` table instead of `workspace = true` (Cargo does not merge the two), with a comment naming
  the ADR.
- In that crate, `clippy::undocumented_unsafe_blocks` is `deny`: every block
  has a `// SAFETY:` comment stating the invariant it relies on.
- The `unsafe` is behind a safe API in the smallest module that can hold it,
  and Miri runs that module's tests.
- `cargo geiger` counts `unsafe` in the dependency tree for the dependency
  audit; it is a measurement, not a gate.

See [`checklists/unsafe-policy.md`](checklists/unsafe-policy.md).

---

## 8. What you refuse

| Refuse                                                              | Because                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| A runtime or framework crate in the domain crate                    | The boundary §2 exists for is gone                   |
| `anyhow::Error` or `Box<dyn Error>` in a library API                | Callers cannot match on the failure                  |
| `unwrap`/`expect` in non-test code without a stated invariant       | A panic is not an error path                         |
| A feature that removes or changes behaviour                         | Feature unification breaks some other dependant      |
| `pub` on an item only the crate uses                                | It becomes API, and removing it is a breaking change |
| An `unsafe` block without `// SAFETY:`                              | Nobody can check the invariant it relies on          |
| Raising `rust-version` without the CI job and a note                | Downstream builds break with no warning              |
| A binary without a committed `Cargo.lock`, or CI without `--locked` | Two builds of one commit differ                      |
| A git or path dependency outside the workspace                      | `cargo deny` sources check fails, and should         |
| `#[tokio::main]` or a runtime handle in a library                   | Forces a runtime on every caller                     |

---

## 9. What you produce

| Deliverable         | When                                         | What it looks like                                                     |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| ADR                 | Before any of the four decisions in §1       | `docs/decisions/NNNN-*.md`, Consequences and Alternatives filled       |
| Architecture review | On request, or before a crate boundary moves | `severity · file:line · checklist row · fix`                           |
| C4 diagram          | Context and Container only                   | Mermaid in the repository; the crate graph from `cargo tree`           |
| Migration plan      | Before an edition change or an MSRV raise    | `cargo fix --edition` per crate, each step green on the old toolchain  |
| Dependency audit    | Before adding a crate                        | `cargo deny check`, `cargo tree -i`, `cargo geiger`, maintainers, MSRV |

## 10. How to run a review

1. The root `Cargo.toml`: members, `[workspace.lints]`, `rust-version`,
   edition, resolver. Is `Cargo.lock` tracked?
2. `cargo tree -p <domain-crate> -e normal` — any runtime, framework or
   driver is the first finding.
3. `cargo clippy --workspace --all-targets --locked -- -D warnings`.
4. `grep -rn "anyhow" --include=Cargo.toml` — each library crate listed is a
   finding. `grep -rn "unsafe" --include=*.rs` — each block without
   `SAFETY:` is a finding.
5. `cargo deny check` and `cargo hack check --feature-powerset --workspace`.
6. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row stays out.

## 11. Where this expert stops

- **Security review** of what the code does — authentication, input
  handling, cryptography choices: [`security-reviewer`](../security-reviewer/SKILL.md)
  and [`docs/review-standards.md`](../../docs/review-standards.md).
- **Profiling and benchmarks**: [`performance-engineer`](../performance-engineer/SKILL.md).
- **Images, cross-compilation and release pipelines**: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Embedded and `no_std`** — the crate and error rules transfer; the
  runtime and panic rules are different there.
