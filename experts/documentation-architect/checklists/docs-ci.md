# Docs CI

Three checks, each pinned and each able to fail a pull request. A docs build
that cannot go red is a build nobody reads.

| #   | Check                                                                                        | How                                                                                 | Source                                                          |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| CI1 | The docs build runs on every pull request with warnings fatal                                | find the job; MkDocs 1.6.1 `mkdocs build --strict`, or the generator's equivalent   | MkDocs 1.6.1 — command line interface                           |
| CI2 | Omitted pages and missing anchors are raised to warnings so strict mode catches them         | `validation.nav.omitted_files: warn` and `validation.links.anchors: warn`           | MkDocs 1.6.1 — configuration, `validation`                      |
| CI3 | A link checker runs on every pull request, pinned to a release                               | the workflow names `lychee-v0.24.2` (or another tool at an exact version)           | lychee v0.24.2 — README                                         |
| CI4 | The pull request link check is offline and checks in-page anchors                            | `lychee --offline --include-fragments` in the job                                   | lychee v0.24.2 — README, `--offline`, `--include-fragments`     |
| CI5 | External links are checked on a schedule and open an issue instead of blocking pull requests | a scheduled workflow; no external link check in the required pull request checks    | lychee v0.24.2 — README                                         |
| CI6 | A prose linter enforces the chosen style guide, pinned                                       | the job names Vale `v3.22.0` and the style package at an exact version              | Vale 3.22.0; Google package v0.7.1 or Microsoft package v0.15.1 |
| CI7 | All three jobs are required status checks on the default branch                              | read the branch protection or ruleset                                               | GitHub Docs — About protected branches (required status checks) |
| CI8 | Each check runs locally with the same command CI uses                                        | run it from a clean checkout; a check that only CI can run is one nobody runs first | Write the Docs — Docs as Code (automated tests)                 |

## Why each one

**CI4 and CI5 split the link check in two on purpose.** Internal links and
anchors are yours and deterministic, so they block. External links fail when
somebody else's server is down, so they report on a schedule instead of
failing unrelated work.

**CI3 and CI6 are pins.** A floating linter changes its rules under you; a red
build then proves nothing about the change that triggered it.

**CI2** exists because the MkDocs defaults report omitted pages and missing
anchors at `info`, which strict mode does not fail on.
