<!--
Thanks for contributing. Fill in every section; an empty required section
fails the automated check. Details: CONTRIBUTING.md
-->

## What this changes

<!-- One or two sentences. Which blueprint, and what is different afterwards? -->

## Change type

<!-- Exactly one. It decides the semver bump. -->

- [ ] `fix` — a correction that does not change what the blueprint sets up (patch)
- [ ] `update` — new option value, version bump, refreshed steps (minor)
- [ ] `feature` — new blueprint, or a new capability in an existing one (minor)
- [ ] `breaking` — removed option, renamed slug, changed schema meaning (major)

## Closest existing blueprint — REQUIRED

<!--
Required for every new blueprint, and for any change that widens an existing
one. Leave it empty and the check fails.
-->

- **Closest blueprint:** <!-- slug, or "none — the catalog has no API blueprint yet" -->
- **What is different:**
- **Why this is not a pull request against that blueprint:**

<!--
Reminder: there are no variants. If the difference is a database, an auth
mechanism or a runtime, it is usually an `option` on the existing blueprint,
not a new slug. If yours is simply better, replace the old one: set
`supersedes: <old-slug>` and mark the old one `deprecated: true`.
-->

## Checklist

- [ ] `pnpm run check` passes
- [ ] `pnpm forgeprint validate` passes
- [ ] `version` in `manifest.yaml` is bumped, and `CHANGELOG.md` has a matching entry
- [ ] Generated files are regenerated and committed (`build-index`, `build-schema`, `build-codeowners` as applicable)
- [ ] Every tag value comes from `schema/taxonomy.yaml` (taxonomy additions are a separate pull request)
- [ ] Every `setup.md` step is numbered, is a single action, and ends with a verification command
- [ ] Versions in `setup.md` are pinned; no piping downloads into a shell, no privilege escalation, no writes outside the project
- [ ] Every commit is signed off (`git commit -s`)
- [ ] Everything added to the repository is in English

## Setup test

<!--
Paste the output of `forgeprint test-setup <slug>` when you have run it, or say
which platform you tested on by hand. (This command arrives in phase 1; until
then, describe what you ran.)
-->

## Anything the reviewer should know

<!-- Trade-offs, known gaps, things you were unsure about. -->
