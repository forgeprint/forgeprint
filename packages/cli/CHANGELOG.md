# Changelog — forgeprint

The catalog tooling. Every pipeline step is a command here, so a contributor
gets the same answer locally that a pull request gets in CI (ADR 0002).

## 0.2.4 — 2026-09-22

- `docs/index.json` carries a blueprint's `provenance`, so the site can show
  where a derived blueprint came from (ADR 0008). Absent rather than empty when
  there is no source.
- `test-setup` no longer reports an error after a run that passed. It removes
  the working directory when it is done, and on Windows a handle can outlive
  the process that held it; it now retries briefly and says where the directory
  is if it still will not go.

## 0.2.3 — 2026-09-22

- `schema/taxonomy.yaml` accepts an `aliases` section: spellings that mean a
  value already in a vocabulary, checked when the taxonomy is parsed. An alias
  pointing at an identifier that does not exist, at a vocabulary that does not
  exist, or shadowing an identifier is refused — the vocabularies stay closed
  (rule 8), this only widens how they can be written.

## 0.2.2 — 2026-09-22

- No change. The version follows the workspace, which moved for a fix in
  `forgeprint-mcp`.

## 0.2.1 — 2026-09-22

### Added

- `forgeprint build-requests` — writes `docs/requests.json` from the open
  `blueprint-request` issues through `gh`, with the date it was taken. It is
  the site's fallback when a reader cannot reach the issues API
  (ADR 0007). Without `gh` it leaves the committed file alone rather than
  replacing a good list with an empty one.
- `validate` now checks every `SKILL.md` against the format the distribution
  tools read — frontmatter, a name that matches its folder, a description, a
  licence, `allowed-tools` as a string, no committed install metadata, and no
  two skills sharing a name (ADR 0006).
- `featured_contributors` in `forgeprint.json`, for the people the site
  credits.

## 0.2.0 — 2026-09-22

The release that makes a setup recipe executable rather than readable.

### Added

- `forgeprint test-setup` — runs a recipe in a fresh temporary directory: every
  step, then its verification, stopping at the first failure with the command
  and its output. It checks the tools a manifest declares in `requires_tools`
  before it starts and installs nothing; a missing tool is a refusal that names
  the tool (ADR 0005). Flags: `--all`, `--options database=postgres,auth=jwt`,
  `--all-options` for the full matrix, `--keep` to keep the working directory.
- `--changed-since <ref>` on `test-setup` — the blueprints a branch changed,
  and every blueprint when the recipe runner itself changed. It compares
  commits, not the working tree. When nothing changed it says so and succeeds,
  which is what lets the recipe run be a required status check without
  blocking pull requests that touch no blueprint.
- A recipe parser behind `test-setup`: a step is one command (the last code
  span) or one file (a path in backticks followed by a fenced block), and a
  step ends at the next heading, so the prose after a recipe is never run.
- `--all` on `lint-setup` and `similarity`.
- Two `lint-setup` rules that came out of running the recipes for real:
  `one-action-per-step` and `write-step-needs-path`.

### Fixed

- `forgeprint --version` reported `0.1.0` whatever was installed. It now
  reports the package version, and a test keeps the two in step.

## 0.1.1 — 2026-09-22

- Published unscoped as `forgeprint`. `0.1.0` went out depending on
  `@forgeprint/cli`, which does not exist and made the package uninstallable;
  it is deprecated on npm.

## 0.1.0 — 2026-09-22

First release.

- `validate` — schema, taxonomy, required files, one blueprint per
  `stack + project_type + requirements`, a CHANGELOG entry per version, and
  generated files that are committed and current.
- `lint-setup` — the structure and safety rules for `setup.md`: numbered steps,
  a verification per step, pinned versions, and no `sudo`, no pipe to a shell,
  no recursive delete, no system paths (rule 20).
- `similarity` — the duplicate report: tag overlap and TF-IDF text similarity
  against the closest blueprint in the catalog.
- `build-index`, `build-schema`, `build-codeowners` — the generated files that
  are committed to the repository so that Pages and CODEOWNERS work without a
  build service.
