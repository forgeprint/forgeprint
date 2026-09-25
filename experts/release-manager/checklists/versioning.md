# Versioning

The version is a promise to everybody whose dependency range includes it.
Deriving it from the history, and writing the derivation down, is what makes
the promise checkable.

| #   | Check                                                                       | How                                                                                                    | Source                                     |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| V1  | The range is from the last release tag to the release commit                | `git describe --tags --abbrev=0`, then `git log <tag>..HEAD`                                           | Semantic Versioning 2.0.0, rules 6 to 8    |
| V2  | A `BREAKING CHANGE:` footer or a `!` before the colon produces a major bump | `git log --format=%B <range> \| grep -nE '^BREAKING[ -]CHANGE:\|^[a-z]+(\([^)]*\))?!:'`                | Conventional Commits 1.0.0, rules 11 to 13 |
| V3  | Any `feat` produces at least a minor bump                                   | count `feat` subjects in the range                                                                     | Conventional Commits 1.0.0, rule 2; FAQ    |
| V4  | Only `fix` and non-functional types produce a patch                         | count by type; nothing else is present                                                                 | Conventional Commits 1.0.0, rule 3         |
| V5  | Below 1.0.0, the public API is not claimed stable anywhere                  | read the README and the package description for stability promises                                     | Semantic Versioning 2.0.0, rule 4          |
| V6  | A release candidate is a pre-release (`X.Y.Z-rc.N`), not a separate number  | read the tag                                                                                           | Semantic Versioning 2.0.0, rule 9          |
| V7  | Build metadata is not used to distinguish two different builds of a release | no `+` suffix is the only difference between two published artifacts                                   | Semantic Versioning 2.0.0, rule 10         |
| V8  | The derivation is written in the release plan                               | the plan names the range, the counts by type, the breaking hashes and the result                       | Semantic Versioning 2.0.0, rule 8          |
| V9  | Every file that states the version agrees                                   | grep the manifest, the lockfile if it records the root, and the changelog heading for the same `X.Y.Z` | Semantic Versioning 2.0.0, rule 3          |

## Why each one

**V2** is the row the whole checklist exists for. A breaking change shipped as a
minor goes straight into every consumer whose range is `^X`, and the first they
hear of it is a broken build.

**V8** turns the number into something a reviewer can redo in a minute. If the
plan only states the result, a wrong result looks exactly like a right one.

**V9** catches the ordinary failure: the tag says one thing, the manifest
another, and the published artifact whichever was read last.
