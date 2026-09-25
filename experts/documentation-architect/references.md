# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. Where a source publishes no version, the row says what was used
instead. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.**

## Structure

| Reference                                                                                                       | Version                                                      | Checked    | Used for                                                                                                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| [Diátaxis](https://diataxis.fr/)                                                                                | No version or date published; site as read on the check date | 2026-09-25 | The four types as the architecture of a set (the site names architecture as one of its three concerns); SKILL.md §3 |
| [Diátaxis — the compass](https://diataxis.fr/compass/)                                                          | as above                                                     | 2026-09-25 | IA2: action or cognition, acquisition or application                                                                |
| [Diátaxis — the map](https://diataxis.fr/map/)                                                                  | as above                                                     | 2026-09-25 | IA3, RF3                                                                                                            |
| [Diátaxis — reference](https://diataxis.fr/reference/)                                                          | as above                                                     | 2026-09-25 | IA7                                                                                                                 |
| [Diátaxis — how to use Diátaxis](https://diataxis.fr/how-to-use-diataxis/)                                      | as above                                                     | 2026-09-25 | IA8 and SKILL.md §2: small published steps rather than a top-down reorganisation                                    |
| [ISO/IEC/IEEE 26514 — Design and development of information for users](https://www.iso.org/standard/77451.html) | 26514:2022, first edition (replaces ISO/IEC 26514:2008)      | 2026-09-25 | IA1, IA4 — planning user information and its structure, cited at document level                                     |

The ISO text was not read; the edition was confirmed from the ISO, IEC and IEEE
catalogue listings. No row cites an ISO clause number.

## Repository files

| Reference                                                                                                                                                                                               | Version                   | Checked    | Used for                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------- | ------------------------------------------------------------------ |
| [GitHub Docs — About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)                                        | current at check          | 2026-09-25 | RF1, RF2: three locations in precedence order; five contents       |
| [GitHub Docs — Setting guidelines for repository contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) | current at check          | 2026-09-25 | RF4                                                                |
| [GitHub Docs — About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)                                | current at check          | 2026-09-25 | RF5, DC4                                                           |
| [GitHub Docs — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)               | current at check          | 2026-09-25 | CI7: required status checks                                        |
| [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)                                                                         | original post, 2011-11-15 | 2026-09-25 | RF6, RF7: sequential numbers never reused; superseded, not deleted |
| [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)                                                                                                                                                | 1.1.0                     | 2026-09-25 | RF8, V7                                                            |

## Docs as code and style

| Reference                                                                               | Version                      | Checked    | Used for                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [Write the Docs — Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)       | no version; page as read     | 2026-09-25 | DC1–DC3, DC8, CI8: issue trackers, version control, plain-text markup, code review and automated tests                                    |
| [Write the Docs — documentation guide](https://www.writethedocs.org/guide/)             | no version; page as read     | 2026-09-25 | IA6                                                                                                                                       |
| [Google developer documentation style guide](https://developers.google.com/style)       | page last updated 2026-04-27 | 2026-09-25 | DC5, DC6: the guide itself, and its precedence — project guidance, then the guide, then Merriam-Webster and _The Chicago Manual of Style_ |
| [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) | page updated 2026-07-06      | 2026-09-25 | DC5: the alternative guide                                                                                                                |

## Tooling, pinned

| Reference                                                                                | Version                                      | Checked    | Used for                                                                       |
| ---------------------------------------------------------------------------------------- | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| [lychee](https://github.com/lycheeverse/lychee)                                          | `lychee-v0.24.2`, released 2026-05-01        | 2026-09-25 | CI3–CI5; `--offline` and `--include-fragments` confirmed in the v0.24.2 README |
| [Vale](https://github.com/errata-ai/vale)                                                | v3.22.0, released 2026-09-17                 | 2026-09-25 | CI6                                                                            |
| [Vale — vocabularies](https://docs.vale.sh/keys/vocabularies)                            | documentation current at check               | 2026-09-25 | DC7: `accept.txt` and `reject.txt`, independent of the style package           |
| [Vale Google style package](https://github.com/errata-ai/Google)                         | v0.7.1, released 2026-08-04                  | 2026-09-25 | CI6                                                                            |
| [Vale Microsoft style package](https://github.com/errata-ai/Microsoft)                   | v0.15.1, released 2026-08-04                 | 2026-09-25 | CI6                                                                            |
| [MkDocs — command line interface](https://www.mkdocs.org/user-guide/cli/)                | 1.6.1, released 2024-08-30 (latest at check) | 2026-09-25 | CI1: `--strict` aborts on any warning                                          |
| [MkDocs — configuration, `validation`](https://www.mkdocs.org/user-guide/configuration/) | 1.6.1                                        | 2026-09-25 | IA5, CI2: `nav.omitted_files` and `links.anchors` default to `info`            |

MkDocs is the worked example because its validation settings are documented
precisely. Sphinx (9.1.0 at check) and other generators have equivalents; the
checklist rows ask for the property, and name MkDocs only to show one way to
get it.

## Versions

| Reference                                                                              | Version                 | Checked    | Used for                                                               |
| -------------------------------------------------------------------------------------- | ----------------------- | ---------- | ---------------------------------------------------------------------- |
| [Semantic Versioning](https://semver.org/)                                             | 2.0.0                   | 2026-09-25 | V2 (§8: incompatible changes increment the major), V6                  |
| [Read the Docs — Versions](https://docs.readthedocs.com/platform/stable/versions.html) | platform docs, `stable` | 2026-09-25 | V1, V3–V5: `stable` versus `latest`, hidden versions, version warnings |

## Deferred to elsewhere

- Page-level writing rules — type per document, running samples, deletions:
  [`technical-writer`](../technical-writer/references.md).
- WCAG 2.2 for the published site: [`docs/review-standards.md`](../../docs/review-standards.md).
