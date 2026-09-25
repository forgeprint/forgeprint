# Public surface

Every `pub` item in a library is a promise. The compiler can hold the
surface to what was intended — if the lints that make it do so are on.

| #   | Check                                                                                         | How                                                                                     | Source                                                                |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| PS1 | `unreachable_pub` is on for the workspace                                                     | `[workspace.lints.rust] unreachable_pub = "warn"`, and CI denies warnings               | rustc lint listing — `unreachable_pub`                                |
| PS2 | `missing_docs` is on for every library crate                                                  | the lint table, or `#![deny(missing_docs)]` in `lib.rs`                                 | rustc lint listing — `missing_docs`                                   |
| PS3 | Items used only inside the crate are `pub(crate)`, not `pub`                                  | PS1 reports each; `cargo doc --no-deps` shows only intended items                       | Rust reference — visibility and privacy                               |
| PS4 | Public enums and structs that may grow are `#[non_exhaustive]`                                | read each public `enum` and struct with public fields                                   | Rust reference — `non_exhaustive`; API guidelines                     |
| PS5 | A library release runs `cargo semver-checks` against the previous published version           | the release workflow or checklist has the step                                          | cargo-semver-checks 0.50                                              |
| PS6 | Public types implement the common traits a caller expects                                     | `Debug` on every public type; `Clone`, `PartialEq`, `Send`/`Sync` where they make sense | Rust API guidelines — interoperability (C-COMMON-TRAITS, C-SEND-SYNC) |
| PS7 | No dependency's type appears in the public API unless that dependency is part of the contract | read public signatures for foreign types; record each one in the ADR                    | Rust API guidelines — C-STABLE (public dependencies)                  |

## Why each one

**PS1 and PS3** together keep the API what the author meant. Without
`unreachable_pub`, an item marked `pub` inside a private module looks
internal in review and becomes reachable the day somebody re-exports the
module — and removing it after that is a breaking change.

**PS5** because semver in Rust is enforced by nobody until a downstream build
breaks. `cargo semver-checks` compares the rustdoc of the two versions and
names the change that needs a major bump; the version number then follows
the report.

**PS7** because a public function returning `reqwest::Response` makes
`reqwest`'s major version part of your major version. Every such type is a
coupling somebody should have decided on.
