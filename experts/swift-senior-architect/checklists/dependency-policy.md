# Dependency policy

A dependency is a promise somebody else keeps. The architect decides which ones
the project is willing to depend on, and makes the list answerable.

| #   | Check                                                                                                         | How                                                                                                    | Source                      |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| DP1 | Every dependency is pinned to a version range the team chose, and no dependency is on a branch                | read `Package.swift` for `branch:` and `revision:`                                                     | SE-0386                     |
| DP2 | `Package.resolved` is committed and CI builds from it                                                         | `git ls-files Package.resolved`; read the CI job for `--disable-automatic-resolution` or an equivalent | SE-0386                     |
| DP3 | A new dependency is justified in writing: what it does, what it replaces, and what happens if it is abandoned | find the note or the ADR; the security review of it belongs elsewhere                                  | `docs/review-standards.md`  |
| DP4 | A dependency reaching into the UI from a non-UI module is a boundary violation, not a convenience             | read which targets import which packages                                                               | SE-0386                     |
| DP5 | A dependency audit produces an SBOM from the toolchain rather than a hand-written list                        | run SwiftPM's SBOM generation; SPDX or CycloneDX                                                       | SE-0509                     |
| DP6 | A dependency that has not released in a year is named in the audit with what the project would do about it    | read the release history of each                                                                       | SE-0509                     |
| DP7 | Nothing depends on a package only to use one function that the standard library has                           | read the import sites of the smallest dependencies                                                     | Swift API Design Guidelines |

## Why each one

**DP5 is new enough to be worth saying.** Swift 6.4 generates SBOMs from
SwiftPM, so a dependency audit is a command and a committed artefact rather
than a table somebody maintains. An audit that is a hand-written list is a list
that was true once.

**DP1 and DP2 are one rule read twice.** A branch dependency makes the build
non-reproducible; an uncommitted or ignored `Package.resolved` makes it
non-reproducible more quietly, because the versions change when somebody else's
resolver runs.

**DP6 is the row that produces work rather than a tick.** "Abandoned" is a
judgement, and the useful output is not a verdict but a sentence: fork it,
replace it, or accept it and say so.
