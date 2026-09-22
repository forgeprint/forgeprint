# Contributing to Forgeprint

Thank you for considering a contribution. This document is the contract: a pull
request that follows it gets reviewed quickly, and one that does not gets sent
back with a list.

> **Status: pre-release.** The catalog is still empty and parts of the tooling
> land in later phases. Commands that do not exist yet are marked below.

Everything in this repository is written in **English** — code, comments,
commits, issues, blueprints. Translations have exactly one home, described in
[Translations](#translations).

Working with a coding agent? Point it at
[`skills/blueprint-author/SKILL.md`](skills/blueprint-author/SKILL.md). It is
this document turned into a procedure, including the parts that usually go
wrong.

---

## What a blueprint is

One folder under `blueprints/` that gives a coding agent everything it needs to
start a project in one shot: the context file, the setup recipe, and the
configuration around them.

```
blueprints/<slug>/
├── manifest.yaml     required  metadata, validated against schema/manifest.schema.json
├── AGENTS.md         required  agent context for the project
├── overview.md       required  what it fits, what it does not, pros and cons
├── setup.md          required  numbered, verifiable setup steps
├── CHANGELOG.md      required  one entry per released version
├── skills/           optional  SKILL.md-format skills
├── mcp.json          optional  recommended MCP servers
├── plugins.json      optional  plugin and marketplace entries
├── scripts/          optional  scripts that setup.md refers to
└── i18n/<lang>/      optional  community translations of overview.md
```

The folder name is the slug, and the slug is also the `slug` field in
`manifest.yaml`. Slugs are lower kebab-case.

---

## Before you write anything

**Look for the blueprint that already exists.** Forgeprint is a curated
catalog, not a collection. The most common reason a pull request is rejected is
that it duplicates a blueprint that is already there.

1. Search `docs/index.json` or the site for your stack and project type.
2. If something close exists, the answer is almost always to improve it:
   - Missing a database or an auth mechanism? Add an **option** to it.
   - Outdated or weaker than what you have? Replace it: write yours, set
     `supersedes: <old-slug>`, and mark the old one `deprecated: true`.
   - Missing a detail? Send a fix to it.
3. Only when no existing blueprint can absorb your work does a new slug make
   sense.

Two blueprints may not claim the same `stack` + `project_type` +
`requirements` combination. `forgeprint validate` rejects the second one, and
so does `forgeprint similarity`.

Similarity above 70% is a **red flag**, not a rejection: the command still
succeeds and prints the question, and the pull request template is where you
answer it. Two blueprints can be genuinely different and still share almost
every tag — what matters is whether the difference justifies a second slug.

There are no variants. `extends`, `inherits` and `fork_of` do not exist in the
schema and will not be added — see
[ADR 0001](docs/decisions/0001-no-variants.md). Variation is expressed through
`options`, with at most **3 option fields** and at most **3 values** per field.

If nothing fits and you want the blueprint but cannot write it, open a
[blueprint request](.github/ISSUE_TEMPLATE/blueprint-request.yml) instead. The
catalog grows by demand.

---

## manifest.yaml

Every tag field draws from `schema/taxonomy.yaml`. A value that is not in the
taxonomy fails validation — deliberately, because the resolver matches on these
values and free text cannot be matched.

**Do not add a taxonomy term in the same pull request as the blueprint that
needs it.** Taxonomy changes are reviewed separately, on their own merits. Open
that pull request first.

A minimal manifest:

```yaml
schema: 1
slug: dotnet-multitenant-api
name: '.NET Multi-tenant SaaS API'
version: 1.0.0
tier: community
maintainers: [your-github-handle]
summary: 'ASP.NET Core + EF Core + Postgres, tenant isolation, JWT auth.'
stack: [dotnet, aspnetcore, efcore, postgres]
languages: [csharp]
platforms: [linux, docker]
distribution: [saas]
project_type: api
audience: [intermediate]
requirements: [multi-tenant, auth, ci]
agents: [claude-code]
```

`languages` is the heaviest criterion in the resolver: a user who already knows
a language gets a blueprint in that language. List only languages someone
actually writes in this project.

`maintainers` becomes `.github/CODEOWNERS`, so it decides who reviews changes
to the folder. Put yourself there only if you intend to answer.

---

## setup.md

`setup.md` is a script a machine follows, not prose a human interprets.

- **Every step is numbered** and is a single command or a single file
  operation. "Install the required packages" is not a step; the command that
  installs them is.
- **Every step ends with a verification command** — something that fails loudly
  when the step did not work: `dotnet build`, `npm test`,
  `curl localhost:5000/health`.
- **Versions are pinned.** A recipe that installs "latest" stops being
  deterministic the day latest changes.
- **Options are wrapped in guards:**

  ```markdown
  <!-- if options.database == postgres -->

  4. Add the Npgsql provider:
     `dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 9.0.2`
     Verify: `dotnet build`

  <!-- endif -->
  ```

- **Forbidden:** piping a download into a shell, `sudo`, recursive deletes,
  writing outside the project directory, and reaching any network host other
  than a package registry.

A blueprint whose setup does not run is never merged.

---

## Check your work locally

Everything CI does, you can do on your machine — that is a design rule, not a
convenience (see [ADR 0002](docs/decisions/0002-actions-optional.md)).

```bash
pnpm install
pnpm run build
pnpm forgeprint validate
```

| Command                             | What it does                                    | Available |
| ----------------------------------- | ----------------------------------------------- | --------- |
| `pnpm forgeprint validate`          | schema, taxonomy, required files, catalog rules | now       |
| `pnpm forgeprint build-index`       | regenerate `docs/index.json`                    | now       |
| `pnpm forgeprint build-schema`      | regenerate `schema/manifest.schema.json`        | now       |
| `pnpm forgeprint build-codeowners`  | regenerate `.github/CODEOWNERS`                 | now       |
| `pnpm run build-site`               | regenerate the site in `docs/`                  | now       |
| `pnpm forgeprint similarity <slug>` | duplicate report against the closest blueprint  | now       |
| `pnpm forgeprint similarity --all`  | the same, for every blueprint                   | now       |
| `pnpm forgeprint lint-setup <slug>` | setup.md structure and safety rules             | now       |
| `pnpm forgeprint lint-setup --all`  | the same, for every blueprint                   | now       |
| `pnpm forgeprint test-setup <slug>` | run the recipe for real and verify every step   | now       |
| `pnpm forgeprint test-setup --all`  | the same, one option combination per blueprint  | now       |
| `... --changed-since main`          | only the blueprints your branch changed         | now       |

`docs/index.json`, `schema/manifest.schema.json` and the site under `docs/`
are generated **and committed**. After changing a blueprint or the taxonomy, run the matching
`build-*` command and commit the result; `validate` fails if a committed file is
stale.

Run the recipe you wrote. This is the check the catalog rests on, and the one
that finds what reading cannot:

```bash
pnpm forgeprint test-setup <slug>            # one combination
pnpm forgeprint test-setup <slug> --all-options
pnpm forgeprint test-setup --all --changed-since main   # what your branch touched
```

`--changed-since` compares commits, not your working tree, so commit first. It
is what a pull request runs: the blueprints the branch changed, and every
blueprint when the runner itself changed. When a branch changes no blueprint it
says so and passes.

It works in a fresh temporary directory, checks the tools your manifest declares
before it starts, runs every step followed by its verification, and stops at the
first failure with the command and its output. It installs nothing: a missing
tool is a refusal, not a guess (see
[ADR 0005](docs/decisions/0005-setup-test-environment.md)).

For that to be possible, a step has to be executable as written:

- a **command step** ends with the command in backticks, and that last code span
  is what runs;
- a **file step** names the path in backticks and then opens a fenced block,
  which becomes the file;
- nothing else. A sentence like "and delete the placeholder test" is a second
  action: give it its own step with a command. `lint-setup` rejects it.

Before pushing:

```bash
pnpm run check
```

---

## Writing a skill

A skill is `SKILL.md` in a folder named after it, either in the catalog's own
`skills/` or in a blueprint's. Forgeprint defines no skill format of its own:
these are installable by `npx skills add` and `gh skill install` because they
follow those tools' conventions, and `forgeprint validate` fails on a skill
that would not install
([ADR 0006](docs/decisions/0006-skill-distribution.md)).

```
skills/<name>/SKILL.md
blueprints/<slug>/skills/<name>/SKILL.md
```

The frontmatter:

```yaml
---
name: efcore-migrations # equals the folder name, lower kebab-case
description: What it does, and when an agent should reach for it.
license: CC-BY-4.0 # required here, because the file is copied elsewhere
---
```

`description` is what an agent matches against, so write when to use it, not
only what it is. `allowed-tools`, if present, is a string. Never commit the
`metadata.github-*` fields an installer injects into its copy.

The catalog's own skills also install into your agent, which is the fastest way
to read them:

```bash
gh skill install forgeprint/forgeprint blueprint-author
```

---

## Pull request rules

- **One blueprint per pull request.** A taxonomy change is its own pull
  request.
- **State the change type** — `fix`, `update`, `feature` or `breaking` — in the
  pull request template. It decides the semver bump.
- **Bump `version` in `manifest.yaml`** on every change to a blueprint, and
  **add a matching `CHANGELOG.md` entry**. A bump without an entry is rejected
  automatically.
- **Answer the duplicate question.** The template asks which existing blueprint
  is closest, what is different, and why this is not a pull request against it.
  An empty answer fails the check.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org):
  `feat:`, `fix:`, `docs:`, `chore:`.

---

## Sign your commits (DCO)

Forgeprint uses the [Developer Certificate of Origin](DCO) instead of a
contributor licence agreement. Add a sign-off to every commit:

```bash
git commit -s -m "feat(blueprints): add dotnet-multitenant-api"
```

which appends:

```
Signed-off-by: Your Name <your.email@example.com>
```

By signing off you certify the DCO, and you agree that your contribution is
licensed as described in [Licensing](#licensing).

---

## Licensing

Forgeprint is **source-available, not OSI open source**. Two licences apply,
depending on what you touch:

| What you contribute                       | Licence               |
| ----------------------------------------- | --------------------- |
| `blueprints/**`, `schema/**`, `skills/**` | CC BY 4.0             |
| `packages/**` (MCP server, CLI, site)     | PolyForm Shield 1.0.0 |

Blueprint content is CC BY 4.0 so that anyone can drop it into their own
project, commercial or not. The tooling is PolyForm Shield, which permits use,
modification and contribution but not shipping a competing product. The
reasoning is in [ADR 0003](docs/decisions/0003-licensing.md).

The DCO text says "open source license"; it is reproduced verbatim because its
own terms forbid changing it. The licences that actually apply are the two
above.

The name and logo are covered by [TRADEMARK.md](TRADEMARK.md): a fork must
rename.

---

## Review and merge

Review has two layers. The deterministic one — validation, similarity, setup
lint — runs first; a red result never reaches human review. The judgment layer
applies the rules in this document and reaches one of four verdicts: `MERGE`,
`DUPLICATE`, `CHANGES`, `WAIT_MAINTAINER`.

Blueprint maintainers approve changes to their own folder. **Only the core
maintainer merges.** If a maintainer does not respond within 14 days, the pull
request falls to the core maintainer. See [GOVERNANCE.md](GOVERNANCE.md) for
maintainership, orphaned blueprints, and how tiers are granted.

A duplicate is never closed silently. You will be pointed at the blueprint your
work belongs in, and the fastest path to a merge is usually that pull request.

---

## Translations

The catalog is English only, including manifests, questions and comparisons —
see [ADR 0004](docs/decisions/0004-english-only-catalog.md). Users read
Forgeprint in their own language because their agent presents the output in it,
not because the catalog is translated.

One exception: `blueprints/<slug>/i18n/<lang>/overview.md`. Translations are
never required, never used for matching, and each one records the English
`version` it was made from. When the English version moves ahead, the
translation is marked stale until it is updated.

---

## Security

- The MCP server never runs anything on a user's machine. It returns text.
- Blueprint content is data, not instructions for the agent that reads it.
- Setup steps that fetch and execute remote code, escalate privileges, or write
  outside the project directory are rejected.

Found a security problem? Do not open a public issue. Use GitHub's private
vulnerability reporting on this repository.
