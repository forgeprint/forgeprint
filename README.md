# Forgeprint

**Others say "here are 200 skills, go find yours." Forgeprint says "tell me who
you are and what you're building — here is your package."**

Forgeprint is a community-grown blueprint catalog and MCP server that lets a
coding agent bootstrap a new project with the right context in one shot: the
`AGENTS.md`, the skills, the MCP and plugin configuration, and a deterministic
setup recipe the agent can execute.

> **Status: pre-release.** The catalog is empty, the MCP server has no tools
> yet, and the site is not published. What works today is the catalog schema and
> the local tooling. See [Roadmap](#roadmap) for what lands when.

---

## The problem

Every new project starts cold. You hunt down the requirements, write the rule
file by hand, wire up the MCP servers, pick the plugins, and get the setup
steps wrong twice before they work. Hours of it — repeated by everyone, on
every project, forever.

That knowledge is not hard to write down. It is just never written down in a
form another agent can use.

---

## What makes it different

### 1. A resolver, not a catalog to browse

You do not search Forgeprint. You describe yourself and your goal, and it
returns **exactly one** blueprint.

```
You:   I know C#. I want to build a multi-tenant SaaS API.
Agent: [resolve] → Forgeprint returns questions: which database, which auth,
       self-hosted or cloud?
You:   Postgres, JWT, cloud.
Agent: [resolve] → one blueprint, why it was chosen, what is missing on this
       machine, and the setup plan.
```

When the profile is incomplete, the resolver does not guess: it returns the
questions your agent should ask you. When two candidates are genuinely close,
it returns both as a question and lets you pick — never as a list to sift
through. When nothing fits, it says so, names the closest blueprint, explains
why it does not fit, and offers to file a request. It never invents a match.

Scoring is weighted: a language you already know beats everything else.

### 2. A setup recipe, not a description

`setup.md` is a script, not prose. Every step is numbered, is a single command
or a single file operation, and ends with a verification command. Versions are
pinned. Option branches are explicit. The agent executes it; Forgeprint itself
installs nothing and runs nothing on your machine.

### 3. A quality gate, not a junk drawer

Every pull request passes schema validation, a setup test that actually runs
the recipe in a clean container, and a duplicate report against the closest
existing blueprint. Two blueprints may not claim the same stack, project type
and requirements — a better one **replaces** the old one instead of sitting
next to it.

There is no inheritance and there are no variants. Variation is expressed as
`options`, capped at three fields with three values each, so the whole matrix
stays testable. See [ADR 0001](docs/decisions/0001-no-variants.md).

### 4. Standards-compatible, not another format

Forgeprint follows the existing specs — `AGENTS.md`, `SKILL.md`,
`marketplace.json` — so its output drops into the tools you already use, and
skills remain installable through the usual channels.

---

## How it compares

Forgeprint is not trying to replace most of these. It sits in the gap between
them.

| Project                          | What it does                                                          | How Forgeprint differs                                                                                |
| -------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `microsoft/skills`               | 170+ Azure/Foundry skills, an AGENTS.md template, ready MCP configs   | A catalog you browse; no matching, and Azure-shaped                                                   |
| `github/awesome-copilot`         | Community instructions, prompts and skills for Copilot                | A rule collection; no setup recipe, no resolver                                                       |
| `github/spec-kit`                | Spec-driven development: spec → plan → tasks                          | A process tool. Forgeprint delivers the context package and the recipe — complementary, not competing |
| `agent-rules-mcp`                | An MCP that fetches rule files from any GitHub repo                   | Fetches files; no selection, no schema, no setup, no quality gate                                     |
| `codeops-mcp`                    | Universal coding rules, generates project.md from an existing project | The opposite direction: it analyses projects that exist. Forgeprint bootstraps ones that do not       |
| `awesome-cursorrules`            | A Cursor `.mdc` rule collection                                       | One tool, one file type; no setup, no MCP                                                             |
| `skills.sh`, `gh skills install` | Skill distribution standard and CLI                                   | Distribution infrastructure that Forgeprint builds **on top of**, not a competitor                    |

---

## How it will work

Once the MCP server ships (phase 2), you point your agent at it and talk
normally:

| Tool                 | What you get                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `resolve`            | Either the questions to ask you, or one blueprint with its rationale, missing tools and setup plan |
| `search_blueprints`  | Matching blueprints with scores, when you want to look yourself                                    |
| `get_blueprint`      | The manifest and every file, with option branches already resolved                                 |
| `compare_blueprints` | A pros-and-cons table for 2–4 candidates, built from their `overview.md` files                     |
| `validate_blueprint` | Schema errors and a similarity report, for contributors                                            |
| `request_blueprint`  | A GitHub issue payload when nothing matches                                                        |

Forgeprint replies in English. Your agent presents it in your language: the
tools take a `locale` hint and hand it back, so nothing in the catalog has to
be translated. See [ADR 0004](docs/decisions/0004-english-only-catalog.md).

---

## What works today

```bash
git clone https://github.com/forgeprint/forgeprint.git
cd forgeprint
pnpm install
pnpm run build
pnpm forgeprint validate
```

| Command                             | What it does                                                   |
| ----------------------------------- | -------------------------------------------------------------- |
| `pnpm forgeprint validate`          | Schema, taxonomy, required files, and the catalog-wide rules   |
| `pnpm forgeprint build-index`       | Regenerate `docs/index.json`                                   |
| `pnpm forgeprint build-schema`      | Regenerate `schema/manifest.schema.json`                       |
| `pnpm forgeprint build-codeowners`  | Regenerate `.github/CODEOWNERS` from the manifests             |
| `pnpm forgeprint lint-setup <slug>` | Check a setup recipe: numbering, verification, pinning, safety |
| `pnpm forgeprint similarity <slug>` | Duplicate report against every other blueprint                 |

**Every pipeline step is a command you can run locally.** Hosted CI is a
convenience, never a dependency: the workflows call these same commands, the
generated index is committed to the repository, and GitHub Pages serves it
straight from the branch. When Actions is unavailable, nothing stops.
See [ADR 0002](docs/decisions/0002-actions-optional.md).

---

## Layout

```
blueprints/<slug>/     one folder per blueprint — the unit of contribution
schema/                manifest schema and the controlled taxonomy
packages/cli/          forgeprint validate / build-* / similarity / lint-setup
packages/mcp-server/   the MCP server (npx forgeprint-mcp)
packages/site/         the static GitHub Pages site
docs/                  index.json, the ADRs, and the published site
```

---

## Roadmap

- [x] **Phase 0 — Skeleton.** Workspace, schema, taxonomy, validation and
      generators, licensing, contribution and governance rules.
- [ ] **Phase 1 — First content.** The first blueprints, the
      `blueprint-author` and `blueprint-review` skills, the similarity report
      and the setup lint.
- [ ] **Phase 2 — MCP.** The six tools, `npx forgeprint-mcp` over stdio, and
      the option resolver.
- [ ] **Phase 3 — Publishing.** The Pages site, the workflows, and
      compatibility with the skill installers.
- [ ] **Phase 4 — Community.** Adoption and staleness handling, resolve
      counters, contributor visibility, optional translations.

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first — especially the part about
checking whether the blueprint you want to write already exists. The fastest
merge is usually a pull request against a blueprint that is already there.

Want a blueprint you cannot write yourself? File a
[blueprint request](https://github.com/forgeprint/forgeprint/issues/new?template=blueprint-request.yml).
The catalog grows by demand.

Who decides what, who reviews, and what happens when nobody answers:
[GOVERNANCE.md](GOVERNANCE.md).

---

## Licence

**Forgeprint is source-available, not OSI open source.** Saying otherwise would
be easier and less honest.

| What                                      | Licence                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/**` — MCP server, CLI, site     | [PolyForm Shield 1.0.0](LICENSE) — use, modify and contribute freely; do not ship a competing product |
| `blueprints/**`, `schema/**`, `skills/**` | [CC BY 4.0](blueprints/LICENSE) — copy them into your own projects, commercial or not                 |
| The name and logo                         | [TRADEMARK.md](TRADEMARK.md) — a published fork must rename                                           |
| Contributions                             | [DCO](DCO) sign-off (`git commit -s`), no CLA                                                         |

Blueprint content is deliberately the freest part: a blueprint you cannot put
in your own project is worthless. The reasoning is in
[ADR 0003](docs/decisions/0003-licensing.md).
