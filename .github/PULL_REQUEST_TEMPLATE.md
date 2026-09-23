<!--
Thanks for contributing. Fill in every section; an empty required section
fails the automated check. Details: CONTRIBUTING.md
-->

## What this changes

<!-- One or two sentences. Which entry, and what is different afterwards? -->

## Kind

<!-- Exactly one. They are reviewed against different rules, and a pull request
that mixes kinds gets the weaker half of both. -->

- [ ] blueprint — `blueprints/<slug>/`
- [ ] expert — `experts/<slug>/`
- [ ] crew — `crews/<slug>/`
- [ ] integration — `integrations/<slug>/`
- [ ] agent-verification — only an `agents` list, plus evidence below
- [ ] taxonomy or tooling — `schema/`, `packages/`, `docs/`

## Change type

<!-- Exactly one. It decides the semver bump. -->

- [ ] `fix` — a correction that does not change what the blueprint sets up (patch)
- [ ] `update` — new option value, version bump, refreshed steps (minor)
- [ ] `feature` — new blueprint, or a new capability in an existing one (minor)
- [ ] `breaking` — removed option, renamed slug, changed schema meaning (major)

## Closest existing entry — REQUIRED

<!--
Required for every new blueprint, expert, crew or integration, and for any
change that widens an existing one. Leave it empty and the check fails.
Not applicable to an agent-verification; say so.
-->

- **Closest entry:** <!-- slug, or "none — the catalog has no API blueprint yet" -->
- **What is different:**
- **Why this is not a pull request against that entry:**

<!--
Reminder: there are no variants. If the difference is a database, an auth
mechanism or a runtime, it is usually an `option` on the existing blueprint,
not a new slug. If yours is simply better, replace the old one: set
`supersedes: <old-slug>` and mark the old one `deprecated: true`.

The same rule, per kind: one expert per role + domain + seniority, one crew per
member-and-integration set, one integration per upstream.
-->

## Checklist

- [ ] `pnpm run check` passes
- [ ] `pnpm forgeprint validate` passes
- [ ] `version` in `manifest.yaml` is bumped, and `CHANGELOG.md` has a matching entry
- [ ] Generated files are regenerated and committed (`build-index`, `build-schema`, `build-codeowners` as applicable)
- [ ] Every tag value comes from `schema/taxonomy.yaml` (taxonomy additions are a separate pull request)
- [ ] Every `setup.md` step is numbered, is a single action, and ends with a verification command (blueprint)
- [ ] Versions in `setup.md` are pinned; no piping downloads into a shell, no privilege escalation, no writes outside the project (blueprint)
- [ ] Every checklist name has a `checklists/<name>.md`, and every checklist row cites a source in `references.md` with a version and a date (expert)
- [ ] `not_for` says something a reader could act on, and the README says where the members disagree (crew)
- [ ] The upstream was opened, the pinned version exists there, and no install command contains a literal credential (integration)
- [ ] `agents` lists only agents this was actually run with
- [ ] Every commit is signed off (`git commit -s`)
- [ ] Everything added to the repository is in English

## Evidence — REQUIRED for a new entry

<!--
Which one applies depends on the kind. All of them answer the same question:
did you run this, or are you describing it?

**Blueprint** — paste the output of `forgeprint test-setup <slug>`, or say which
platform you ran the recipe on by hand.

**Expert** — say what you used it on and what came out differently. "I ran it
against X and it caught Y" is the only evidence that settles whether the text
changes what an agent does.

**Crew** — say which stretch of work you assembled it for, and where the members
disagreed in practice.

**Integration** — say that you opened the upstream, that the pinned version
exists there, and that the install command worked on the agent you claim.

**Agent-verification** — a transcript, a log or a description specific enough
that somebody could repeat it. `agents[]` means tested, and this is the field
that cannot afford an unevidenced claim.
-->

## Anything the reviewer should know

<!-- Trade-offs, known gaps, things you were unsure about. -->
