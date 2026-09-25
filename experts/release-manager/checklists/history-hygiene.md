# History hygiene

The history is the input to every release decision. These rows are about
whether the repository enforces what it says, not about what it says.

| #   | Check                                                                                     | How                                                                                                  | Source                                        |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| H1  | Changes reach the default branch only through a pull request                              | `gh api repos/<owner>/<repo>/rulesets`; look for _Require a pull request before merging_             | GitHub Docs — rules for rulesets              |
| H2  | Force pushes to the default branch are blocked                                            | the same listing; _Block force pushes_                                                               | GitHub Docs — rules for rulesets              |
| H3  | Deleting the default branch and release tags is restricted                                | _Restrict deletions_ on the branch and on `refs/tags/v*`                                             | GitHub Docs — rules for rulesets              |
| H4  | Required status checks are named, and the release job depends on them                     | read the ruleset's check list and the release workflow's `needs:`                                    | GitHub Docs — rules for rulesets              |
| H5  | One merge policy is declared; if the history is meant to be linear, it is enforced        | _Require linear history_ is on, or the contributing guide names the merge style and the repo matches | GitHub Docs — rules for rulesets              |
| H6  | The origin policy (DCO sign-off, signed commits, both or neither) is declared and checked | `git log --format='%h %(trailers:key=Signed-off-by,valueonly)' <range>` or `%G?`; a CI job fails it  | DCO 1.1; GitHub Docs — Require signed commits |
| H7  | Commit subjects follow `<type>[scope][!]: <description>`                                  | a pinned commit-message linter in CI; `git log --format=%s <range>` read once by hand                | Conventional Commits 1.0.0, rule 1            |

## Why each one

**H2** is the one that makes the others meaningful. If the default branch can
be force-pushed, every tag and every derived version rests on history that can
change underneath it.

**H6** exists because a sign-off policy that nothing checks drifts within a
month. The check is one `git log` format string; there is no reason to trust it
instead.

**H7** is not style. §2 of the skill derives the version from commit types; a
subject that is not a Conventional Commit is a commit the derivation cannot
classify.
