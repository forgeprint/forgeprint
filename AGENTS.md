# Working in this repository

Context for a coding agent asked to change Forgeprint itself. If you are here
to _use_ Forgeprint, you want [README.md](README.md) and
[docs/mcp.md](docs/mcp.md) instead.

Forgeprint is a catalog and an MCP server. A user says what they know and what
they are building; the catalog answers with exactly one blueprint, a
deterministic setup recipe, and the experts, crews and integrations to work on
it with. It installs nothing and runs nothing on anybody's machine: every tool
returns text.

The repository is **public**, source-available rather than OSI open source, and
written entirely in English.

## Getting set up

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Node ≥ 20 and pnpm. Nothing else: whatever a blueprint needs belongs to that
blueprint's own recipe, not here.

## The one command that decides

```bash
pnpm run check
```

Formatting, lint, every test, `forgeprint validate`, `render-check` and the
published site. **Do not commit while it is red** — if there is no test for
what you are changing, write the test first. Every step of it is a CLI command
that runs locally, because no design here may depend on GitHub Actions being
available ([ADR 0002](docs/decisions/0002-actions-optional.md)).

Useful on their own:

| Command                               | What it answers                                       |
| ------------------------------------- | ----------------------------------------------------- |
| `pnpm forgeprint validate`            | schema, taxonomy, CHANGELOG and cross-reference       |
| `pnpm forgeprint similarity <slug>`   | is this a duplicate of something already in here      |
| `pnpm forgeprint lint-setup <slug>`   | is a recipe step unpinned, privileged or unverifiable |
| `pnpm forgeprint test-setup <slug>`   | does the recipe actually work, step by step           |
| `pnpm forgeprint render --agent <id>` | the per-agent files, generated from the one source    |
| `pnpm run build-site`                 | `docs/`, which is committed and served by Pages       |

## What lives where

| Path                             | What it is                                                 |
| -------------------------------- | ---------------------------------------------------------- |
| `blueprints/<slug>/`             | what is being built: manifest, `AGENTS.md`, `setup.md`     |
| `experts/<slug>/`                | how the agent should work: `SKILL.md`, checklists, sources |
| `crews/<slug>/`                  | a named package of experts and integrations, by slug       |
| `integrations/<slug>/`           | a pinned install recipe for somebody else's software       |
| `schema/`                        | the manifest schema, the taxonomy, the agent registry      |
| `packages/{cli,mcp-server,site}` | the tooling, TypeScript, strict, ESM                       |
| `docs/`                          | **generated** site output plus documentation               |
| `docs/decisions/`                | the ADRs. Read the relevant one before arguing with it     |

`docs/index.json`, `docs/catalog.html`, the unit pages, `sitemap.xml` and
`llms.txt` are generated and committed. Regenerate them in the same change, or
`pnpm run check` fails.

## What gets a change refused

These are not style preferences. Each one has a decision record behind it.

- **No variants.** No `extends`, `inherits` or `fork_of`, ever. Variation is
  `options`: at most three fields, at most three values each
  ([ADR 0001](docs/decisions/0001-no-variants.md)).
- **One slug per combination.** A second blueprint for the same
  stack + project_type + requirements is rejected; a better one replaces the
  old one through `supersedes`. One expert per role + domain + seniority +
  languages ([ADR 0015](docs/decisions/0015-experts-per-language.md)), one crew
  per member set, one integration per upstream.
- **No hand-written per-agent file.** Content is written once as `AGENTS.md`
  and `SKILL.md`; `forgeprint render --agent <id>` produces the rest
  ([ADR 0013](docs/decisions/0013-agent-agnostic.md)).
- **No tag outside the taxonomy.** Extending `schema/taxonomy.yaml` is its own
  pull request.
- **No English-only exception.** Nothing in this repository is written in
  another language ([ADR 0004](docs/decisions/0004-english-only-catalog.md)).
- **A recipe step is one action with a verification command.** Versions pinned;
  no `curl | sh`, no `sudo`, no writes outside the project.
  `forgeprint lint-setup` enforces it.
- **A version bump needs a CHANGELOG entry**, and every pull request names the
  closest existing entry and why it is not a change to that one instead.
- **Nothing that identifies a person or a machine.** No secrets even as
  examples, no email addresses, no local filesystem paths, no employer or
  client names. The pre-commit hook runs `gitleaks`; read the diff yourself as
  well.

## Commits

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), small and
single-purpose. Every commit is signed off, and the sign-off names the commit's
own author in the same trailer block as any `Co-authored-by` line — git reads
only the last paragraph as trailers, and so does the DCO check.

Each unit pull request rewrites the same generated files under `docs/`, so
merges conflict mechanically: rebase on the new `main`, keep your unit's folder,
regenerate `docs/`, force-push with lease.

## Further

- [CONTRIBUTING.md](CONTRIBUTING.md) — what each kind of entry must contain
- [GOVERNANCE.md](GOVERNANCE.md) — who decides, and what happens to an
  unmaintained entry
- [SECURITY.md](SECURITY.md) — how to report a vulnerability
- [CLAUDE.md](CLAUDE.md) — the maintainer's own project memory: the same rules
  in full, with the roadmap and the reasoning
