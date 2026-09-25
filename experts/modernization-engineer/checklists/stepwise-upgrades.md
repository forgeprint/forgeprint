# Stepwise upgrades

Dependency and runtime upgrades go one major version per step, following the
vendor's own guide for that step, with the suite green between steps.

| #   | Check                                                                                           | How                                                                                            | Source                                                             |
| --- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| UP1 | Current version, target version and end-of-support dates are written in the plan, from a source | `curl -s https://endoflife.date/api/v1/products/<product>/`, or the vendor's release schedule  | endoflife.date API v1 (schema 1.2.1)                               |
| UP2 | Deprecation warnings on the current version are cleared before the upgrade                      | run the build and tests with warnings shown; the count is zero or each remaining one is listed | Semantic Versioning 2.0.0, FAQ on deprecation                      |
| UP3 | Each step crosses one major version                                                             | read the plan: 16 → 17 → 18, not 16 → 18                                                       | Angular — Versioning and releases (vendor example)                 |
| UP4 | Each step follows the vendor's upgrade guide for that exact version pair, linked in the plan    | the plan links the guide per step                                                              | Angular — Versioning and releases (vendor example)                 |
| UP5 | A vendor codemod's output is committed separately from hand edits                               | `git log` shows a codemod commit, then a hand-edit commit                                      | Fowler, _Refactoring_, 2nd ed. (2018), ch. 2                       |
| UP6 | The runtime and the framework are upgraded in separate pull requests                            | each pull request changes one of them                                                          | Fowler, Branch By Abstraction (2014-01-07) — release at every step |
| UP7 | The lockfile is committed with each step, and the full suite passes on it                       | the pull request contains the lockfile; CI is green                                            | The Twelve-Factor App — II. Dependencies                           |
| UP8 | Characterization tests exist for the code the upgrade's breaking changes touch                  | map each breaking change in the guide to a test                                                | Feathers (2004), ch. 13                                            |

## Why each one

**UP3** because upgrade guides and their migration tools are written for one
step. Skipping one means applying two sets of breaking changes at once with
tooling built for neither.

**UP2** is the cheapest part of an upgrade. A deprecation warning is the next
major version's breaking change, announced in advance, and fixing it on the old
version means the upgrade itself changes less.

**UP8** connects the upgrade to the rest of the method: the guide lists what
breaks, and each of those is a change point that needs a test before the bump.
