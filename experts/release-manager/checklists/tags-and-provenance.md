# Tags and provenance

A tag names exactly one commit forever. A published artifact says where it came
from, and somebody checks that it does.

| #   | Check                                                                                     | How                                                                               | Source                                                        |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| T1  | Release tags are annotated (or signed), not lightweight                                   | `git cat-file -t vX.Y.Z` prints `tag`                                             | Git 2.55 — `git tag` (`-a`, `-s`)                             |
| T2  | The tag points at the commit whose required checks passed                                 | compare `git rev-list -n1 vX.Y.Z` with the SHA of the green CI run                | GitHub Docs — rules for rulesets                              |
| T3  | A pushed tag is never moved or deleted; a mistake gets a new version                      | a tag ruleset on `refs/tags/v*` blocks updates and deletions                      | Git 2.55 — `git tag`, "On Re-tagging"                         |
| T4  | If tags are signed, the signature verifies                                                | `git verify-tag vX.Y.Z`                                                           | Git 2.55 — `git tag`                                          |
| T5  | Publishing runs in CI with OIDC trusted publishing where the registry supports it         | the publish job has `id-token: write`; no registry token secret is referenced     | npm Docs — trusted publishing; PyPI Docs — trusted publishers |
| T6  | npm publishing uses a CLI new enough for trusted publishing                               | the workflow pins npm at 11.5.1 or later and Node 22.14.0 or later                | npm Docs — trusted publishing                                 |
| T7  | Long-lived publish tokens are disallowed once trusted publishing works                    | the package setting "Require two-factor authentication and disallow tokens" is on | npm Docs — trusted publishing                                 |
| T8  | Provenance is verified after publishing, from the consumer side                           | `npm audit signatures`, or `gh attestation verify <file> --repo <owner>/<repo>`   | SLSA v1.2 Build track; GitHub CLI 2.101                       |
| T9  | The claimed SLSA Build level is the one the platform provides, stated in the release plan | L1 provenance exists; L2 a hosted platform signs it; L3 a hardened platform       | SLSA v1.2 — Build track basics                                |

## Why each one

**T3** is the rule people break under pressure. A tag that moves after somebody
fetched it means two machines hold different code under one name, and nothing
tells either of them. Git's own manual says to use a different name.

**T5** removes the one credential in a release pipeline that outlives the job: a
long-lived registry token on a workstation or in a secret store. The OIDC token
lasts minutes and is bound to the workflow.

**T8** exists because provenance generated and never verified protects nobody.
One verification command in a clean consumer is the difference between having
provenance and claiming it.
