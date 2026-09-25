# Repository files

The files a platform reads by name. Each one belongs in a place the platform
documents, exactly once.

| #   | Check                                                                                                            | How                                                                         | Source                                             |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| RF1 | `README.md` exists in one location GitHub reads (`.github/`, root or `docs/`), and only one                      | `git ls-files` for `README.md` at those three paths                         | GitHub Docs — About READMEs                        |
| RF2 | The README says what the project does, why, how to start, where to get help and who maintains it                 | read it against the five points                                             | GitHub Docs — About READMEs                        |
| RF3 | The README links into the documentation set instead of containing it                                             | count headings after "getting started"; reference sections belong elsewhere | Diátaxis — the map                                 |
| RF4 | `CONTRIBUTING.md` exists once, in `.github/`, root or `docs/`                                                    | `git ls-files` for it at the three paths                                    | GitHub Docs — Setting guidelines for contributors  |
| RF5 | `CODEOWNERS` exists once, in `.github/`, root or `docs/`                                                         | `git ls-files` for it at the three paths                                    | GitHub Docs — About code owners                    |
| RF6 | ADRs live in one folder, numbered sequentially, and no number is reused                                          | list the folder; the sequence has no duplicates                             | Nygard, _Documenting Architecture Decisions_, 2011 |
| RF7 | A reversed decision is kept and marked superseded, not deleted                                                   | `git log --diff-filter=D` on the ADR folder returns nothing                 | Nygard, _Documenting Architecture Decisions_, 2011 |
| RF8 | `CHANGELOG.md` at the root follows Keep a Changelog 1.1.0: newest first, an `Unreleased` section, dated versions | read its first twenty lines                                                 | Keep a Changelog 1.1.0                             |

## Why each one

**RF4 and RF5 are about the second copy.** GitHub picks one location by a fixed
order and shows that file; a stale copy elsewhere is read by humans and
followed by nobody's tooling.

**RF7** keeps the history that makes an ADR folder worth having. A deleted ADR
leaves a gap in the numbering and a later reader rebuilding the same argument.
