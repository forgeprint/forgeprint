# Changelog

The changelog is for the person deciding whether and how to upgrade. It is not
the commit log, and a generated draft is only a draft.

| #   | Check                                                                          | How                                                                            | Source                                       |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------- |
| C1  | `CHANGELOG.md` exists at the repository root                                   | `test -f CHANGELOG.md`                                                         | Keep a Changelog 1.1.0                       |
| C2  | An `## [Unreleased]` section sits at the top and is emptied into the release   | `grep -n '^## \[Unreleased\]' CHANGELOG.md` finds one line, above others       | Keep a Changelog 1.1.0                       |
| C3  | The release has exactly one heading, `## [X.Y.Z] - YYYY-MM-DD`                 | `grep -c '^## \[X.Y.Z\] - [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' CHANGELOG.md` is 1 | Keep a Changelog 1.1.0; ISO 8601 dates       |
| C4  | Entries are grouped under Added, Changed, Deprecated, Removed, Fixed, Security | read the entry; no other group names                                           | Keep a Changelog 1.1.0                       |
| C5  | Every breaking change says what the upgrader does instead                      | read each Removed and Changed line for a replacement or a migration step       | Keep a Changelog 1.1.0; SemVer 2.0.0, rule 8 |
| C6  | A removal was announced as a deprecation in an earlier minor release           | find the Deprecated line in an older entry                                     | Semantic Versioning 2.0.0, FAQ deprecation   |
| C7  | No commit hashes, merge subjects or bot noise are pasted in                    | `grep -nE '\b[0-9a-f]{7,40}\b\|Merge (pull request\|branch)' CHANGELOG.md`     | Keep a Changelog 1.1.0                       |
| C8  | A withdrawn version is marked `[YANKED]` rather than removed                   | the heading for the withdrawn version is still there, with the marker          | Keep a Changelog 1.1.0                       |

## Why each one

**C5** is where most changelogs fail the reader. "Removed the legacy
exporter" tells them they are broken; "Removed the legacy exporter; use
`export --format=v2`" tells them what to do about it.

**C6** is SemVer's own advice for deprecation, and the reason a major release
should contain nothing a careful reader has not already been warned about.

**C8** keeps the record honest. Deleting the entry for a bad release makes the
changelog disagree with the registry, where the version still exists.
