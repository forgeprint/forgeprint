# Feature flags

Cargo builds each dependency once, with the union of every feature any crate
in the graph asked for. A feature is therefore not a private switch; it is a
change to a shared build.

| #   | Check                                                              | How                                                                                        | Source                                            |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| FF1 | Every feature only adds items or implementations                   | read each `#[cfg(feature = ...)]`; a `cfg(not(feature))` that removes an item is a finding | Cargo reference — features: feature unification   |
| FF2 | No two features are mutually exclusive                             | no `compile_error!` on a feature combination                                               | Cargo reference — features: mutually exclusive    |
| FF3 | Every feature combination builds                                   | CI runs `cargo hack check --feature-powerset --workspace` (or `--each-feature`)            | cargo-hack 0.6                                    |
| FF4 | `default` features are the minimum useful set                      | read `[features] default`; each entry has a reason                                         | Cargo reference — features: default               |
| FF5 | Optional dependencies use `dep:` so they are not implicit features | `[features]` entries say `dep:name`                                                        | Cargo reference — features: optional dependencies |
| FF6 | Every feature is documented                                        | a comment per `[features]` entry, or the crate docs list them                              | Cargo reference — features: documentation         |

## Why each one

**FF1** is the rule unification makes necessary. If crate A enables `fast`
on a dependency and crate B was written against the behaviour without it, B's
build silently changes when A is added to the graph. Additive features are
the only kind that cannot do that.

**FF3** because the number of combinations grows as two to the number of
features, and nobody tests them by hand. A feature that only compiles when
another is also on is found by a user with a smaller `default`.
