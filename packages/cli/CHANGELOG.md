# Changelog — forgeprint

The catalog tooling. Every pipeline step is a command here, so a contributor
gets the same answer locally that a pull request gets in CI (ADR 0002).

## 0.2.9 — 2026-09-23

- **`release` quotes its arguments on Windows.** The shell is needed there
  because npm, pnpm and gh are `.cmd` shims that cannot be executed directly,
  and `shell: true` hands the line to cmd without quoting anything: `git tag -m
Forgeprint 0.2.8` arrived as two arguments and the tag was never created.
  Same class as the `C:\Program Files` split fixed in the tool check.
- **A release that stopped after tagging can be finished.** `release` refused
  with "v0.2.9 already exists locally" when the tag and the GitHub release were
  done and npm was not — which is precisely the state it claims to be safe to
  re-run from. It now asks the question that matters: have the published
  packages changed since the tag was cut? If they have, the tag no longer
  describes what would go to npm and it says to bump instead. If they have not
  — the only commits since touched a private package — it skips the tag, makes
  sure it is on the remote, and carries on to the part that is left.
- **A failed git step prints what git said.** It reported "could not create
  v0.2.8" and threw the output away, which sent the maintainer looking for a
  tag that did not exist. That is twice now that swallowing a command's output
  cost more than the bug did.

## 0.2.8 — 2026-09-23

- No change to the tooling. The version follows the workspace.

## 0.2.7 — 2026-09-23

- **`provenance: human | generated` in the manifest**, defaulting to `human`,
  and the schema refuses `provenance: generated` with `tier: official`. A tool
  drafting a blueprint and CI running its recipe is a different claim from a
  person standing behind it, and the difference is what a reader is trusting
  the catalog for (ADR 0011).
- The object that records which project a blueprint was derived from is now
  `derived_from`, with its URL under `url`. It held the name `provenance` and
  no blueprint used it yet, so the rename cost nothing.
- `docs/index.json` carries both fields, so the site and the MCP server can say
  which is which.

## 0.2.6 — 2026-09-22

- **`forgeprint release <version>`.** Cutting 0.2.5 by hand took six commands
  and produced three wrong diagnoses: a rejected token that npm reports as
  `404 Not Found`, a publish that succeeded and then reported `409 Cannot
publish over previously staged version`, and `npm view --prefer-online`
  serving the previous version for minutes after the package page showed the
  new one. The last one nearly cost a version number that was never stuck.

  So the command does not believe the publish. It publishes one package at a
  time and then asks the registry what happened, retrying because the registry
  lags, and an error is only an error if the registry agrees. It also checks
  the working tree, that every published package is at the version and has a
  changelog entry for it, and — when `gh` can reach GitHub — that CI is green
  on the commit about to be tagged, because tags are protected and releases
  cannot be edited. Without Actions it says the CI state is unknown and lets
  the maintainer decide (ADR 0002); it never requires Actions to work.

  The first run writes a draft of the release notes from the changelogs and
  stops, so a human rewrites them before anything immutable exists. Running it
  again after a failure is safe: whatever is already done is skipped.

- **Recipes run against Git Bash on Windows, not the WSL launcher.** `bash` on
  PATH there is usually `System32\bash.exe`, which starts and then reports
  `execvpe(/bin/bash) failed` when no distribution is installed — so every step
  of every recipe failed for a reason that was not the recipe. The shell is now
  looked for where Git installs it, and `FORGEPRINT_BASH` overrides that. The
  tool check also stopped putting a full path through `cmd`, which split
  `C:\Program Files\...` at the space and reported bash as missing while it sat
  there.

  It waits for CI rather than refusing. "Still running" is not "failed", and
  the difference was being paid for by hand: run the command, read that the
  matrix is in progress, wait, run it again. `--no-wait` restores the refusal.

  Output is captured with room for the whole test suite. The default limit is
  1MB and `pnpm run check` prints close to it, so the release succeeded or
  failed depending on how much its own logs happened to say. When a step does
  fail, the lines that name the failure are printed rather than the last
  twenty — which were the runner's epilogue, naming the package and never the
  test — and the whole output is written to a file.

## 0.2.5 — 2026-09-22

- `no-system-paths` no longer fires inside a fenced `dockerfile` block. The
  image's filesystem is not the reader's: `/usr/local` is where a container
  puts what it installs, and the rule is about the machine running the recipe.
  Every other rule still applies inside that block, and a system path in a
  shell block is still refused.
- A recipe may name a domain RFC 2606 and RFC 6761 reserve for documentation —
  `example.com`, `example.org`, `example.net`, `.invalid`. A step that proves a
  server refuses a foreign `Origin` has to send one, and those names resolve to
  nothing anybody runs, so naming one is not the network access this rule is
  looking for.

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
