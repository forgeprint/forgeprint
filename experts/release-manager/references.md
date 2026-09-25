# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Two rows are already tracked in
[`docs/review-standards.md`](../../docs/review-standards.md) — SLSA and the
NIST SSDF — and are cited at the versions recorded there rather than copied.
Everything else is listed here with the version current when it was read and
the date of that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.**

## Versions, commits and changelogs

| Reference                                                              | Version                                                                                  | Checked    | Used for                                                                                          |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| [Semantic Versioning](https://semver.org/spec/v2.0.0.html)             | 2.0.0                                                                                    | 2026-09-25 | `versioning.md` V1, V5 to V9; `changelog.md` C5, C6; `withdrawal.md` W1. Rule 3 is immutability   |
| [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) | 1.0.0 — no later version published                                                       | 2026-09-25 | `history-hygiene.md` H7; `versioning.md` V2 to V4. Rules 11 to 13 are the breaking-change markers |
| [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)               | 1.1.0 — the version the site presents as current (the site's own repository is at 1.1.2) | 2026-09-25 | `changelog.md` C1 to C4, C7, C8; `withdrawal.md` W7                                               |
| [Developer Certificate of Origin](https://developercertificate.org/)   | 1.1                                                                                      | 2026-09-25 | `history-hygiene.md` H6 — the `Signed-off-by:` trailer                                            |

## Git and the forge

| Reference                                                                                                                                                                               | Version                       | Checked    | Used for                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------- | -------------------------------------------------------------------------------- |
| [Git — `git tag`](https://git-scm.com/docs/git-tag)                                                                                                                                     | Git 2.55.0 documentation      | 2026-09-25 | `tags-and-provenance.md` T1, T3, T4 — annotated and signed tags, "On Re-tagging" |
| [GitHub Docs — Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) | current at check              | 2026-09-25 | `history-hygiene.md` H1 to H6; `tags-and-provenance.md` T2                       |
| [GitHub CLI](https://github.com/cli/cli/releases)                                                                                                                                       | v2.101.0, released 2026-09-15 | 2026-09-25 | `tags-and-provenance.md` T8 — `gh attestation verify`                            |

## Publishing and provenance

| Reference                                                                              | Version                                                 | Checked                                                                 | Used for                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [npm Docs — Trusted publishing](https://docs.npmjs.com/trusted-publishers)             | current at check; requires npm CLI 11.5.1, Node 22.14.0 | 2026-09-25                                                              | T5 to T7 — OIDC from GitHub Actions, GitLab CI/CD and CircleCI; automatic provenance on the first two |
| [PyPI Docs — Trusted publishers](https://docs.pypi.org/trusted-publishers/)            | current at check                                        | 2026-09-25                                                              | T5 — OIDC exchanged for a 15-minute upload token                                                      |
| [pypa/gh-action-pypi-publish](https://github.com/pypa/gh-action-pypi-publish/releases) | v1.14.2, released 2026-07-29                            | 2026-09-25                                                              | The example publishing action for PyPI; pin it by commit SHA, not by tag                              |
| [SLSA](https://slsa.dev/spec/v1.2/build-track-basics)                                  | v1.2 (Approved)                                         | 2026-09-22, via review-standards; build-track levels re-read 2026-09-25 | T8, T9 — Build L1 provenance exists, L2 hosted platform, L3 hardened builds                           |
| [NIST SSDF, SP 800-218](https://csrc.nist.gov/projects/ssdf)                           | v1.1                                                    | 2026-09-22, via review-standards                                        | `withdrawal.md` W5 — RV.1.3, roles and processes for remediation                                      |

## Withdrawal

| Reference                                                                              | Version             | Checked    | Used for                                                                           |
| -------------------------------------------------------------------------------------- | ------------------- | ---------- | ---------------------------------------------------------------------------------- |
| [npm Docs — Unpublish policy](https://docs.npmjs.com/policies/unpublish)               | current at check    | 2026-09-25 | W2, W3, W6 — the 72-hour window, the conditions after it, and no reuse of a number |
| [PEP 592 — Adding "Yank" Support to the Simple API](https://peps.python.org/pep-0592/) | Final               | 2026-09-25 | W4, W6 — installers skip a yanked release unless it is pinned with `==` or `===`   |
| [ADR 0012](../../docs/decisions/0012-experts-crews-integrations.md)                    | Accepted 2026-09-23 | 2026-09-25 | W8 — an expert names its boundary, and deployment rollback is not this one's       |

## Not cited

- **Release-automation tools** (semantic-release, release-please, changesets)
  are named nowhere as a requirement. The rule is the mapping in §2; any tool
  that implements it, pinned, with its output in the plan, satisfies it.
- **A commit-message linter** is required in H7 without naming one; commitlint
  (`@commitlint/cli` 21.2.3 on npm on 2026-09-25) is one pinned example.
