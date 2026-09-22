# Launch plan

Where Forgeprint gets listed, what each place actually requires, and the text
to submit. Every requirement below was read from the source on **2026-09-22**;
each row says where. Directories change their rules quietly, so re-check the
row you are about to use rather than trusting this file.

**Nothing is submitted before the [dogfood test](dogfood.md) passes.** A
listing brings people to a first experience; if that experience needs help from
the maintainer, the listing is a liability.

---

## Order

1. Dogfood test green.
2. Repository prerequisites below (`mcpName`, `server.json`, the plugin
   marketplace file) — each is a small pull request.
3. The **official MCP registry**. Several directories read it, so it goes
   first and does some of the work for the others.
4. Directories that index by themselves: Glama, PulseMCP (when it reopens).
5. Submissions with a human on the other end: mcp.so, awesome-mcp-servers.
6. Lists with an eligibility window: awesome-claude-code, awesome-copilot.
7. Announcement — only then.

---

## Repository prerequisites

| What                                           | Where                                                             | Why                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"mcpName": "io.github.forgeprint/forgeprint"` | `packages/mcp-server/package.json`, then publish **0.2.1** to npm | The registry verifies ownership by reading `mcpName` from the published package. It must be on npm **before** publishing to the registry               |
| `server.json`                                  | repository root                                                   | The registry's own manifest (below)                                                                                                                    |
| `.claude-plugin/marketplace.json`              | repository root                                                   | Lets anyone run `/plugin marketplace add forgeprint/forgeprint`. There is no central Claude Code plugin registry, so this file **is** the distribution |

---

## 1. Official MCP registry

_Source: `modelcontextprotocol/registry` — `docs/modelcontextprotocol-io/quickstart.mdx`, `authentication.mdx`, `package-types.mdx`._

| Requirement                                                | Forgeprint today                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package published on the public npm registry               | ✅ `forgeprint-mcp@0.2.0`                                                                                                                               |
| `mcpName` in `package.json`, matching `server.json` `name` | ❌ to add, then publish 0.2.1                                                                                                                           |
| Namespace proven by GitHub OAuth                           | ✅ `io.github.forgeprint/*` — **@aliosmanmho must be an Owner of the org**, not merely a member. Ordinary membership no longer grants the org namespace |
| `server.json` at the repository root                       | ❌ to add                                                                                                                                               |

```bash
brew install mcp-publisher     # or the prebuilt binary
mcp-publisher init             # writes a server.json template
mcp-publisher login github     # device flow, as the org Owner
mcp-publisher publish
```

`server.json` to commit:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.forgeprint/forgeprint",
  "title": "Forgeprint",
  "description": "Resolve a developer profile to exactly one project blueprint and return its CI-tested setup recipe.",
  "version": "0.2.1",
  "repository": {
    "url": "https://github.com/forgeprint/forgeprint",
    "source": "github"
  },
  "packages": [
    {
      "registryType": "npm",
      "identifier": "forgeprint-mcp",
      "version": "0.2.1",
      "transport": { "type": "stdio" }
    }
  ]
}
```

Publishing from CI later is the roadmap item already recorded: GitHub OIDC,
alongside npm trusted publishing.

---

## 2. Glama

_Source: glama.ai/mcp/servers, read 2026-09-22._

Glama indexes public GitHub repositories by itself and grades each server on
licence, quality and maintenance, with an **Add Server** button for anything it
has not found. Nothing to prepare: the repository is public, the package is on
npm, and the README is the description it will read.

Action: check whether `forgeprint/forgeprint` is already listed a few days
after the registry entry. If not, use **Add Server**. Then claim it so the
author shows as claimed rather than inferred.

Note: the licence grade may be low, because the tooling is PolyForm Shield
rather than OSI-approved. That is the deliberate choice in §8 and the README
says so in the first screen; do not soften it to score better.

---

## 3. PulseMCP

_Source: pulsemcp.com/submit, read 2026-09-22._

> "We are not accepting new MCP server or client submissions right now."

Submissions are paused while they rebuild their pipeline, and their own advice
is to publish to the official registry, which they pick up automatically once
they reopen. So: **no action** beyond step 1. Re-check monthly.

---

## 4. mcp.so

_Source: mcp.so/submit, read 2026-09-22._

A form: repository URL (required) and name. Free submissions go through
review; there is a $39 option that skips review and adds a verified badge and
featured placement.

Action: free submission. Do not pay — a paid badge on a project that is one
week old buys nothing that the dogfood test and the CI badges do not.

```
Name: Forgeprint
Repository: https://github.com/forgeprint/forgeprint
Description: Tell your agent what you know and what you are building;
Forgeprint returns exactly one project blueprint — agent context, skills, MCP
configuration and a setup recipe whose every step is executed in CI. Six tools:
resolve, search_blueprints, get_blueprint, compare_blueprints,
validate_blueprint, request_blueprint. Install: npx -y forgeprint-mcp
```

---

## 5. awesome-mcp-servers (punkpeye)

_Source: `punkpeye/awesome-mcp-servers` — `CONTRIBUTING.md` and `README.md`, read 2026-09-22._

Requirements: a public GitHub repository that people install and run
themselves (Forgeprint is stdio — correct list; remote-only servers go to
`awesome-remote-mcp-servers`), one server per line, alphabetical order inside
its section, a concise factual description. A catalog-style server belongs in
the **🔗 Aggregators** section.

Legend: `📇` TypeScript/JavaScript, `🏠` local service, `🍎` macOS, `🪟`
Windows, `🐧` Linux.

The line to add, alphabetically by `forgeprint/forgeprint`:

```markdown
- [forgeprint/forgeprint](https://github.com/forgeprint/forgeprint) 📇 🏠 🍎 🪟 🐧 - Resolves a developer profile to exactly one project blueprint and returns its agent context, skills and a setup recipe whose steps are executed in CI.
```

Pull request title: `Add Forgeprint to Aggregators`. The repository fast-tracks
agent-written pull requests titled with `🤖🤖🤖` — use it only if an agent
actually wrote the change, which for one line it need not.

---

## 6. awesome-claude-code

_Source: `hesreallyhim/awesome-claude-code` — `CONTRIBUTING.md`, read 2026-09-22._

**Eligibility is a gate, not a formality.** A resource must be at least 14 days
old counted from the first commit on the default branch, _or_ have 100 stars.
Forgeprint's first commit is **2026-09-22**, so the earliest submission date is
**2026-10-06** unless it passes 100 stars first.

Other rules: submit through the web UI issue form only — not a pull request,
not `gh`; one resource per submission; human-submitted, even when the resource
was built with an agent; a one-line description with no sales language, no
emoji, and no addressing the reader. Open source is preferred and closed source
faces barriers; be straightforward that Forgeprint is source-available, with
the catalog itself under CC BY 4.0.

Description to submit:

```
An MCP server and curated blueprint catalog that returns a single project blueprint — agent context, skills and a setup recipe executed in CI — for a stated language and goal.
```

---

## 7. awesome-copilot (github)

_Source: `github/awesome-copilot` — `CONTRIBUTING.md`, read 2026-09-22._

This one takes **skills**, not MCP servers, so what goes there is
`blueprint-author` and `blueprint-review` — one per pull request, in
`skills/<name>/SKILL.md`, frontmatter `name` matching the folder and a
non-empty `description`, which is exactly the shape `forgeprint validate`
already enforces (ADR 0006).

Process: fork, branch from `main` (not `staged`), copy the skill folder, then

```bash
npm run skill:validate
npm run build          # regenerates the README tables
```

and open the pull request against `main`, confirming the README was
regenerated.

Decide first whether these two skills are useful to somebody who is not
contributing to Forgeprint. `blueprint-author` arguably is — "turn this
project into a reusable blueprint" is a general task. `blueprint-review` is
governance for this repository and probably does not belong there.

---

## 8. skills.sh

_Source: skills.sh docs and FAQ, read 2026-09-22._

There is no submission. Skills appear on the leaderboard automatically through
anonymous telemetry when people run `npx skills add <owner/repo>`, so the only
lever is the README install line, which is already there and verified working
(ADR 0006).

Optional: a **pack** — an unlisted collection installable with one command,
created by signing in with Vercel. Worth it only if Forgeprint ends up with
several skills worth installing together; two is not enough.

---

## 9. Claude Code plugin marketplace

_Source: code.claude.com/docs/en/plugin-marketplaces, read 2026-09-22._

There is no central registry, no approval, and no listing process: a
marketplace is a file in a repository, and users add it directly. So this is
not a submission but a feature to ship.

`.claude-plugin/marketplace.json`:

```json
{
  "name": "forgeprint",
  "owner": { "name": "Forgeprint", "url": "https://github.com/forgeprint" },
  "plugins": [
    {
      "name": "blueprint-author",
      "source": "./skills/blueprint-author"
    }
  ]
}
```

Each plugin also needs its own `.claude-plugin/plugin.json` with `name`,
`description`, `version` and `author`. Validate before publishing:

```bash
claude plugin validate .
```

Then the README gains one line:

```
/plugin marketplace add forgeprint/forgeprint
```

Reserved names (`claude-code-marketplace`, `anthropic-plugins`, …) are refused;
`forgeprint` is fine.

---

## 10. Smithery

_Source: smithery.ai/docs/build/publish, read 2026-09-22._

Smithery takes two kinds of server: one reachable at a public HTTPS URL over
streamable HTTP, which it proxies; or a prebuilt `.mcpb` bundle for stdio
servers, which it distributes for clients to run locally.

Forgeprint is stdio and nothing is hosted, so the URL path does not apply
without running a service — which contradicts §4, since the MCP server is meant
to need nothing but npx. The `.mcpb` bundle is the honest path, and it is real
work: a bundle to build, and a second artifact to keep in step with every
release.

**Deferred.** Revisit when there is demand from Smithery users; it is not a
launch blocker, and an unmaintained bundle is worse than no listing.

---

## The announcement itself

Only after everything above, and after the dogfood test is recorded as clean in
[dogfood.md](dogfood.md).

What leads, in every channel, is the same sentence the README leads with:
others hand you two hundred skills and wish you luck; Forgeprint asks two
questions and hands you one package. What backs it up is the part nobody else
has: **the setup recipes are executed in CI, every option combination, every
step and every verification.**

Link the site, not the repository — the site shows the catalog and the install
line, and the repository is one click further.
