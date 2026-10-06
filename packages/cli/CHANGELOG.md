# Changelog — forgeprint

The catalog tooling. Every pipeline step is a command here, so a contributor
gets the same answer locally that a pull request gets in CI (ADR 0002).

## 0.4.5 — 2026-10-06

- **`get` writes the recipe it tells you to run.** It printed "read setup.md
  and run it step by step" and wrote every file except that one, so the path
  built for agents with no MCP client (ADR 0013) handed over an entry without
  the thing the entry is for. It now writes `setup.md` too, with `--options`
  resolved, because an unresolved block is two recipes and the reader has to
  know which half applies. A field nobody chose stays guarded and is named in
  the output.

## 0.4.4 — 2026-10-06

- **A publish the registry has not caught up with is not a failed publish.**
  0.4.3 put both packages on npm correctly and turned the release workflow red:
  npm accepted `forgeprint-mcp@0.4.3` and said so, the registry was still
  serving the previous version two and a half minutes later, and the only
  outcome for that was `failed`. A published version is immutable, so the gap
  is propagation — and calling it a failure invites somebody to re-run a
  release that already happened. It is now its own outcome, reported as
  accepted with the command that confirms it.
- **The registry wait is five minutes rather than two and a half.** Not the
  fix, since no window is long enough to be a guarantee, but the common case
  should not be lost to it.
- **The MCP Registry login advice names a flag that exists.** It said to set
  `MCP_GITHUB_TOKEN`, which `mcp-publisher` 1.8.1 does not read, so following
  it ran the device flow — the one the advice was written to avoid, and the one
  that cannot see an organization namespace. The token goes in
  `login github -token`. `docs/launch-plan.md` already had it right, so the
  repository was contradicting itself and the wrong copy was the one the tool
  printed. Two more things the step needed and did not say: an empty `-token`
  silently becomes a device flow, so the snippet prompts and checks the
  length; and the registry token `login` stores expires **five minutes** after
  it is issued, so the publish has to follow the login rather than wait for a
  convenient moment.

## 0.4.3 — 2026-10-06

- **A CI state that could not be read is no longer a pass.** `release` printed
  `CI state unknown` as a note and carried on, so `--yes` tagged 0.4.1 while
  `setup-test` was still running: `gh` had timed out, and nothing between the
  note and the tag asked anybody. The four states are now a decision —
  `red` refuses, `green` proceeds, `--skip-ci` is the maintainer saying they
  verified it, and unverifiable asks. Releasing without Actions stays possible,
  because §4 says it must; it just stops being the default.
- **`--yes` cannot answer that question.** It means "do not ask whether I
  meant it", not "an unverifiable check counts as verified", so an unverifiable
  CI with `--yes` is refused and names the flag that does answer it.

## 0.4.2 — 2026-10-05

What 0.4.0 and 0.4.1 actually failed on, named.

- **A missing trusted publisher is reported as a missing trusted publisher.**
  npm reports it as `ENEEDAUTH`, "you need to authorize this machine", because
  after the registry declines the OIDC exchange npm falls through to an
  unauthenticated publish. The cause is one line above the symptom and only at
  `--loglevel verbose`: a 404 from
  `/-/npm/v1/oidc/token/exchange/package/<name>`, whose body says "package not
  found" for a package the registry plainly serves. That endpoint is per
  package, so it means no publisher is registered on that package.
- **`npm publish` runs at `--loglevel verbose`** on the trusted path, because
  the line that says why is not printed at the default level. Two releases
  were spent on hypotheses that line would have settled.

## 0.4.1 — 2026-10-05

0.4.0's own release, which did not reach npm. The tag stays where it is and
the version moves, as it did for 0.2.9 — the fix changed this package, so the
old tag would no longer describe what npm gets.

- **A failed publish prints what npm said.** The classifier printed its
  conclusion and threw the output away, so 0.4.0's `publish --trusted` failure
  arrived as one sentence of advice with no status code behind it — the exact
  afternoon that message was written to save. npm's output is now printed
  above the advice, every path.
- **"No credentials" and "credentials refused" are separate outcomes.**
  `ENEEDAUTH` used to be classified with 404 and 401 and share their message,
  which described a trusted publisher that does not match. Under OIDC the two
  are different repairs: `ENEEDAUTH` means the exchange was never attempted,
  a 404 that it was attempted and refused. Each says so now.
- **The release workflow no longer passes `registry-url` to
  `actions/setup-node`.** Given one it writes an .npmrc holding
  `_authToken=${NODE_AUTH_TOKEN}` and points `NPM_CONFIG_USERCONFIG` at it, so
  npm finds an auth token already configured — empty, because trusted
  publishing sets no `NODE_AUTH_TOKEN` — and sends that instead of asking
  GitHub for a token. `registry.npmjs.org` is npm's default, so the field
  bought nothing.

## 0.4.0 — 2026-10-05

Eleven days of tooling, and the half of trusted publishing that lives in this
repository.

- **`release` can hand npm over.** `publish <version> --trusted` packs with
  pnpm — so `workspace:*` is rewritten to a real version — and publishes the
  tarball with npm, which is the client that performs the OIDC exchange.
  `release --skip-npm` stops after the tag and the GitHub release, and pushing
  that tag is what starts
  [`release.yml`](../../.github/workflows/release.yml). No token exists
  anywhere on that path and npm attaches provenance itself. The other end is
  configured on npmjs.com and matched on the workflow **filename**, which is
  the one field worth reading twice
  ([releasing.md](../../docs/releasing.md)).
- **Rule 9 keys an expert on `role + domain + seniority + languages`**
  (ADR 0015). The triple alone meant one architect held every language.
  `languages` compares as a set, so order does not matter; an expert that
  names none is the stack-neutral one, and there is still exactly one of those
  per triple. A language-specific expert must have checklists about its
  language, and a label with nothing behind it is still caught by
  `similarity`.
- **`lint-setup` refuses a write step whose target is not a file.** A step
  whose sentence ended on `` `storage` `` took the directory as the path and
  died with `EISDIR` — inside a container, after the twenty-four steps before
  it had already run. The rule reads the path through the same `writeTarget`
  the runner uses: two implementations of it would have disagreed eventually,
  and the disagreement was the bug. `test-setup` now catches what no shape
  check can see — a plausible path that is a directory on disk — and names the
  rule instead of surfacing `EISDIR`.
- **The package registries of Flutter, Phoenix, Gradle and Android** —
  pub.dev, the three hex.pm hosts, the Gradle plugin and service hosts,
  maven.google.com and dl.google.com. Each is where that ecosystem's own
  tooling installs from. An `xmlns` value is a name rather than a host, so the
  `http://schemas.android.com/...` every Android manifest must declare
  verbatim no longer reads as an unencrypted fetch.
- **A secret written into an install command is caught, and a long variable
  name is not.** The check flagged any twenty-character run, so
  `--env SAMPLE_SERVICE_CLIENT_SECRET_VALUE=$...` failed validation; and it
  looked for `=NAME=`, which never occurs, so a literal value passed. It now
  flags a named secret assigned anything that does not begin with `$`, and a
  key-shaped run that mixes upper case, lower case and digits — a shape that
  variable names and flags do not have.
- **Resolving options keeps the blank lines inside code blocks.** Blank runs
  were collapsed everywhere, so a recipe that writes Python lost the two
  blank lines ruff expects between top-level definitions, and `get_blueprint`
  served the same damaged text.
- **`gh` output and the distribution manifests are parsed, not cast.**
  `JSON.parse(...) as T` let an error body read as a list of no CI runs, and a
  wrong field in `server.json` or a `plugin.json` pass silently. Each goes
  through a zod schema now: an unreadable `gh` response is reported as unknown
  CI, and a wrong manifest field names its file.
- **Two publish failures survive pnpm's formatting.** pnpm wraps its report to
  the terminal width and prefixes continuation lines with a box character, so
  "not running in an interactive terminal" arrived split across lines and
  matched nothing — 0.3.1's release printed the raw error instead of the
  instruction written for it. Phrases are matched after the box drawing is
  stripped, and the fixtures are pnpm's own output pasted verbatim rather than
  retyped onto one line.
- **An expired MCP Registry token under an organization** is told to use a
  `read:org` PAT through `MCP_GITHUB_TOKEN`. The advice before was the browser
  login, which cannot see the organization, and nothing in a namespace's name
  distinguishes the two cases — so it says both rather than guessing.

## 0.3.1 — 2026-09-24

`release`, taught by what publishing 0.3.0 actually took.

- **Two publish failures are named.** `403 E_STAGE_REQUIRED` is a token created
  "Read and write (stage only)" — invisible locally, since `npm whoami` and
  `npm token list` report it exactly like a working one — and the message says
  what to generate instead. "Not running in an interactive terminal" is a
  browser 2FA challenge in a subprocess, and the message gives the by-hand
  command. Neither waits on the registry for a package it never received.
- **The registry wait loop actually waits.** It asked `npm view` five times in
  a row with no pause, which takes seconds; 0.3.0 was invisible for about
  ninety. Six attempts, thirty seconds apart.
- **Distribution manifests are part of the version gate.** `server.json` and
  every `plugin.json` must carry the release version before anything is
  tagged, and a missing version field is a problem rather than agreement. They
  had drifted eight releases behind npm with nothing noticing.
- **`release` publishes to the MCP Registry itself**, instead of printing a
  reminder nobody followed for eight releases. It skips when the registry
  already serves the version, names a missing `mcp-publisher` as a PATH
  problem, and recognises the registry's 403 for an organization namespace —
  whose advice to "make your membership public" is out of date.

## 0.3.0 — 2026-09-24

The catalog holds four kinds now, and so does the tooling (ADR 0012, ADR 0013).

- **Three new manifest schemas** — expert, crew and integration — each governed
  the way a blueprint is, plus what makes each one mean something: a checklist
  name must have a file behind it, a crew holds at most six members, an
  integration pins its upstream and keeps that pin separate from its own
  version.
- **`validate` extended** to all four kinds, their cross-references, and the
  agent registry against the vocabulary that derives from it. A recommendation
  pointing at nothing now fails, because it breaks no build and costs the
  reader everything.
- **`similarity --expert`** applies rule 10 to `SKILL.md` and the checklists.
  The scoring engine is written once and each kind says what to feed it.
- **`render --agent <id>`** writes one entry in the layout one agent reads,
  from the single source. It refuses past an agent's silent cap rather than
  letting the content be truncated.
- **`render-check`** renders every entry for every registered agent — the half
  of an agent matrix a machine can actually prove.
- **`get <slug> --agent <id>`** is the path for agents with no MCP client,
  deliberately the same code as `render`.
- **`lint-integration`** holds an install command to a setup step's standards:
  no pipe into a shell, no privilege escalation, no moving tag, no literal
  credential, and no declared secret the command never passes.
- The published index now carries experts, crews, integrations and the agent
  registry, because the MCP server and the site read that file and nothing
  else.

## 0.2.10 — 2026-09-23

- No change beyond 0.2.9, which was tagged and released on GitHub and never
  reached npm. Finishing it needed the resume fix in 0.2.9 itself, and that fix
  changed this package — so the tag stopped describing what npm would get, and
  the command said to bump. It was right.

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
