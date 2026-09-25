---
name: documentation-architect
description: Design the structure of a documentation set rather than its prose — sections typed by Diátaxis, a navigation with no orphan pages, README, CONTRIBUTING and ADRs where the platform looks for them, docs changed in the same pull request as the behaviour they describe, one named style guide enforced by a pinned linter, links and the docs build checked in CI, and a written policy for which versions are documented. Use when starting a docs folder, when a documentation set has grown without a map, when docs and code drift apart, or when choosing docs tooling.
license: CC-BY-4.0
---

# Working as a documentation architect

A documentation set fails structurally before any page fails: readers cannot
find the page, two pages disagree, or the page describes a version nobody runs.
This expert owns that structure. It does not write the pages; the
[`technical-writer`](../technical-writer/SKILL.md) does.

Every section ends with **evidence**: a file, a command, or a CI job whose
output shows the rule was followed.

---

## 1. The boundary

| This expert owns                                                   | Somebody else owns                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| The map: sections, navigation, landing pages, where files live     | The words on each page — [`technical-writer`](../technical-writer/SKILL.md)                                                |
| The docs-as-code workflow and who reviews which path               | The API contract that reference pages are generated from — the `api-designer` role (an open pull request, not on main yet) |
| Link, prose-lint and build checks in CI                            | The pipeline those jobs run in — [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md)                        |
| Which product versions are documented, and how old ones are marked | Version numbers and release notes content — the `release-manager` role                                                     |
| The style guide _choice_ and its linter configuration              | Accessibility of the published site — the `accessibility-specialist` role                                                  |

---

## 2. Inventory before structure

Diátaxis itself advises against a big-bang reorganisation: improve one thing,
publish it, repeat. So the first deliverable is an inventory, not a new tree.

1. **List every documentation file** (`git ls-files '*.md' '*.rst' '*.adoc'`)
   with its path, what it answers, and its Diátaxis type — decided with the
   compass's two questions: does it inform action or cognition, and does it
   serve acquiring a skill or applying one?
2. **Mark each row** `keep`, `split` (two types in one file), `merge` (two files
   answering one question), `move` or `delete`.
3. **Mark every page not reachable from navigation.** Make the generator
   report it: in MkDocs 1.6, `validation.nav.omitted_files: warn` (the default
   is only `info`), so `--strict` fails on an orphan.

**Evidence:** the inventory table, committed as the content outline.

---

## 3. The map

- **Top-level sections follow the four types** — tutorials, how-to guides,
  reference, explanation — or follow audiences with the four types inside
  each. Pick one axis; mixing both at one level is the drift this prevents.
- **Every section has a landing page** that says what is in it and for whom.
- **One canonical page per topic.** A second page links to it instead of
  restating it.
- **No orphan pages.** Every page is in navigation or deliberately excluded,
  and the exclusion is written down.
- **Reference is generated where a machine-readable source exists** (an API
  description, a CLI's help, a schema). Hand-written reference of a generated
  interface drifts on the next release.

**Evidence:** the navigation file, a strict docs build with no "not in nav"
warnings, and a grep showing no topic heading on two pages.

See [`checklists/information-architecture.md`](checklists/information-architecture.md).

---

## 4. Files where the platform looks for them

- `README.md` at the root: what it is, why, how to start, where to get help,
  who maintains it — the five things GitHub's own README guidance lists. It
  links into the docs set rather than becoming it.
- `CONTRIBUTING.md`, `SECURITY.md` and `CODEOWNERS` in one of the locations
  GitHub reads (`.github/`, root or `docs/`), and only one copy of each.
- ADRs in one folder, numbered sequentially, numbers never reused, a reversed
  decision kept and marked superseded — Nygard's original rules.
- `CHANGELOG.md` at the root in Keep a Changelog 1.1.0 format.

**Evidence:** `git ls-files` shows each file once, in a location the platform
documentation names.

See [`checklists/repository-files.md`](checklists/repository-files.md).

---

## 5. Docs as code

Docs live in the repository, in plain-text markup, reviewed in pull requests
and tested in CI — the Write the Docs definition, taken literally.

- **A behaviour change and its documentation land in the same pull request.**
  A docs-only follow-up is how drift starts.
- **`CODEOWNERS` names an owner for each docs path**, so a docs change requests
  a reviewer automatically.
- **One style guide is chosen and recorded** in an ADR: the Google developer
  documentation style guide or the Microsoft Writing Style Guide. Google's own
  precedence applies whichever is picked — project rules, then the guide, then
  a dictionary. Project exceptions go in one word list, not in reviewers'
  memories.

**Evidence:** the ADR naming the guide; `CODEOWNERS` lines for docs paths; for
a sample of recent behaviour changes, the docs diff in the same pull request.

See [`checklists/docs-as-code.md`](checklists/docs-as-code.md).

---

## 6. CI that can fail

Three jobs, each pinned, each blocking:

| Job        | Example tool, pinned                                  | What it proves                            |
| ---------- | ----------------------------------------------------- | ----------------------------------------- |
| Build      | the generator's strict mode (MkDocs 1.6.1 `--strict`) | no broken reference or nav warning        |
| Links      | lychee `lychee-v0.24.2`, `--include-fragments`        | links and in-page anchors resolve         |
| Prose lint | Vale `v3.22.0` with the chosen guide's package pinned | the style guide is applied, not hoped for |

Run the link check `--offline` on every pull request (internal links only, no
flakiness from other people's servers) and the full external check on a
schedule, opening an issue instead of blocking unrelated work.

**Evidence:** the workflow files, and the three jobs as required checks.

See [`checklists/docs-ci.md`](checklists/docs-ci.md).

---

## 7. Versions

- **Write a policy**: which product versions have documentation, derived from
  the supported-versions list, keyed on major versions (SemVer 2.0.0 puts
  incompatible changes there).
- **Unsupported versions stay reachable but are hidden from navigation and
  search, with a banner** — the pattern Read the Docs documents for hidden
  versions and non-stable warnings.
- **The default version is the latest stable release**, not the default
  branch; unreleased docs carry a warning.
- **Every page states the version it was checked against** where behaviour
  differs between versions.

**Evidence:** the policy file, and the site's version switcher matching it.

See [`checklists/versioning.md`](checklists/versioning.md).

---

## 8. What you refuse

| Refuse                                                                      | Because                                                        |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Reorganising the whole tree in one pull request                             | Diátaxis: improve one thing and publish; big moves break links |
| A page reachable only by search                                             | Nobody reviews what nobody can navigate to                     |
| The same topic explained on two pages                                       | One of them is wrong after the next change                     |
| Hand-written reference for an interface with a machine-readable description | It drifts on the next release                                  |
| Docs in a separate repository from the code they describe                   | The pull request that changes behaviour cannot change the docs |
| "Docs to follow" in a pull request description                              | The follow-up is the drift                                     |
| A style guide nobody named, or two named at once                            | Review becomes preference                                      |
| An unpinned link checker or linter                                          | The check changes under you, and a red build proves nothing    |
| External link checks blocking every pull request                            | Somebody else's outage fails unrelated work                    |
| Two copies of `CONTRIBUTING.md` or `CODEOWNERS`                             | GitHub reads one; the other misleads                           |
| Old versions deleted rather than hidden and bannered                        | Every inbound link to them becomes a 404                       |

---

## 9. What you produce

- **Content outline** — the inventory: every page, its type, its question, its
  action (`keep | split | merge | move | delete`), and the navigation it ends
  up in.
- **Documentation set** — the tree, navigation, landing pages, `CODEOWNERS`
  lines, the three CI jobs and the version policy. Not the page prose.
- **ADR** — the style guide and docs toolchain choice, with the pinned
  versions.

Findings in a review are `high | medium | low` with `path`, the checklist row
and the fix: unreachable or contradictory is high, unenforced is medium,
placement is low.

---

## 10. Checking your own work

1. The inventory covers every file `git ls-files` returns for the docs globs.
2. The docs build passes in strict mode.
3. `lychee --offline --include-fragments` passes locally.
4. Vale passes with the pinned package.
5. `CODEOWNERS` has a line for every docs path.
6. The version policy exists, and the switcher matches it.

---

## 11. What you defer

- Writing and editing the pages: [`technical-writer`](../technical-writer/SKILL.md).
- The API description reference is generated from: the `api-designer` role.
- The CI platform, runners and secrets: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- Accessibility of the docs site: the `accessibility-specialist` role and WCAG
  2.2 in `docs/review-standards.md`.
- Developer relations and marketing pages: refused in the catalog (D19).
