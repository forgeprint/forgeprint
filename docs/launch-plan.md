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
2. ~~Repository prerequisites~~ — done: `mcpName`, `server.json`, the plugin
   marketplace file.
3. ~~The **official MCP registry**~~ — done, 2026-09-22:
   `io.github.forgeprint/forgeprint` 0.2.1, active. Several directories read
   it, so the rest starts from there.
4. Directories that index by themselves: Glama, PulseMCP (when it reopens).
5. Submissions with a human on the other end: mcp.so, awesome-mcp-servers.
6. Lists with an eligibility window: awesome-claude-code, awesome-copilot.
7. Announcement — only then.

---

## Repository prerequisites

| What                                              | Where                                                                           | Why                                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ `"mcpName": "io.github.forgeprint/forgeprint"` | `packages/mcp-server/package.json` — **0.2.1 still has to be published to npm** | The registry verifies ownership by reading `mcpName` from the published package. It must be on npm **before** publishing to the registry               |
| ✅ `server.json`                                  | repository root                                                                 | The registry's own manifest (below)                                                                                                                    |
| ✅ `.claude-plugin/marketplace.json`              | repository root                                                                 | Lets anyone run `/plugin marketplace add forgeprint/forgeprint`. There is no central Claude Code plugin registry, so this file **is** the distribution |

---

## 1. Official MCP registry

_Source: `modelcontextprotocol/registry` — `docs/modelcontextprotocol-io/quickstart.mdx`, `authentication.mdx`, `package-types.mdx`._

| Requirement                                                | Forgeprint today                                                                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package published on the public npm registry               | ✅ `forgeprint-mcp@0.2.0`; 0.2.1 pending                                                                                                                                                  |
| `mcpName` in `package.json`, matching `server.json` `name` | ✅ added; publish 0.2.1 to npm before registering                                                                                                                                         |
| Namespace proven by GitHub OAuth                           | `io.github.forgeprint/*` needs **two** things from @aliosmanmho: the **Owner** role in the org, and a **public** membership. Both, or the registry hands out `io.github.<user>/*` instead |
| `server.json` at the repository root                       | ✅ committed                                                                                                                                                                              |

Install the publisher. There is no npm package for it: a prebuilt binary, or
Homebrew on macOS.

```powershell
# Windows
$dir = "$env:USERPROFILEin"
New-Item -ItemType Directory -Force $dir | Out-Null
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "$dir\mcp-publisher.tar.gz"
tar xf "$dir\mcp-publisher.tar.gz" -C $dir mcp-publisher.exe
Remove-Item "$dir\mcp-publisher.tar.gz"
```

```bash
# macOS / Linux
brew install mcp-publisher
```

Then, **from the repository root**, because `publish` reads `./server.json`:

```powershell
& "$env:USERPROFILEin\mcp-publisher.exe" login github     # device flow, as the org Owner
& "$env:USERPROFILEin\mcp-publisher.exe" publish
```

`mcp-publisher init` writes a `server.json` template; this repository already
has one, so it is not needed.

**The 403 that catches everyone**, and the three wrong answers it invites:

```
You have permission to publish: io.github.<user>/*.
Attempting to publish: io.github.<org>/...
```

What it is **not**:

- **Not your role.** `gh api user/memberships/orgs/<org>` returning
  `role: admin` is necessary and not sufficient.
- **Not a hidden membership.** The error suggests publicising it; the registry
  never reads public membership. Its code calls
  `GET /user/memberships/orgs?state=active` and grants the namespace where the
  role is `admin`.
- **Not the OAuth App access policy.** The registry authenticates through a
  **GitHub App** (client id `Iv23li…`), so the organization's third-party OAuth
  application page never lists it and shows no pending request. Removing those
  restrictions weakens the organization and changes nothing here.

What it is: the token handed to the registry could not read your organization
membership. The device flow grants organization access only if you use the
per-organization **Grant** button on the authorization screen, above
_Authorize_ — easy to walk past, and the resulting token is silently
org-less.

**The reliable fix**, and the one the registry documents: authenticate with a
classic personal access token whose only scope is `read:org`. The registry
never reads your code, so it needs nothing else.

```powershell
& "$env:USERPROFILEin\mcp-publisher.exe" logout
& "$env:USERPROFILEin\mcp-publisher.exe" login github --token <PAT>
& "$env:USERPROFILEin\mcp-publisher.exe" publish C:\Project\Forgeprint\server.json
```

This is what published `io.github.forgeprint/forgeprint` 0.2.1 on 2026-09-22.
The token can be deleted immediately afterwards: the grant lives in the
registry's own token, not in the PAT.

**To see what a token actually grants** rather than guessing, decode the
`permissions` claim of `~/.config/mcp-publisher/token.json`. Before the fix it
reads `io.github.<user>/*` alone; after it, the organization is there. That one
check would have skipped every wrong answer above.

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
configuration and a setup recipe whose every step is executed in CI — and the
experts, crews and integrations to work on it with. Ten tools: resolve,
search_blueprints, get_blueprint, compare_blueprints, validate_blueprint,
request_blueprint, recommend_experts, get_expert, get_crew, get_integration.
Install: npx -y forgeprint-mcp
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
marketplace is a file in a repository, and users add it directly. So this was
not a submission but a feature to ship, and it is shipped.

`.claude-plugin/marketplace.json` offers the catalog skills as plugins, each
with its own `.claude-plugin/plugin.json`. The skill folders keep their
`SKILL.md` at the plugin root, which the documented single-skill shortcut
loads as that plugin's only skill — no duplicated files, and the same folders
`npx skills add` and `gh skill install` already use (ADR 0006).

```
/plugin marketplace add forgeprint/forgeprint
/plugin install blueprint-author@forgeprint
```

`claude plugin validate .` passes on the marketplace and on both plugin
manifests. Bump each plugin's `version` when its skill changes, the way the
packages are bumped.

Reserved marketplace names (`claude-code-marketplace`, `anthropic-plugins`, …)
are refused; `forgeprint` is fine.

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

---

## 12. Per-agent channels

_Added with ADR 0013. Forgeprint is not a Claude Code product; Claude Code is
the first client verified end to end, and the channels should say so._

Nine agents are registered in `schema/agents.yaml`. Each has a place where its
users look for context files, and none of them is the MCP registries above.

| Agent               | Channel                         | What to post                                                                                                                              |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor              | `PatrickJS/awesome-cursorrules` | That `forgeprint render --agent cursor` writes a `.cursor/rules/*.mdc` with the frontmatter Cursor needs — the rule file, not the catalog |
| GitHub Copilot      | `github/awesome-copilot`        | The generated `.github/copilot-instructions.md` for one blueprint                                                                         |
| Gemini CLI          | Gemini CLI extensions           | The MCP server, and the `context.fileName` note — `AGENTS.md` works there only once it is added to that setting                           |
| Cline               | Cline marketplace               | The MCP server                                                                                                                            |
| OpenCode, Codex CLI | Their own registries            | The MCP server; both read `AGENTS.md` directly                                                                                            |
| Windsurf, Kiro      | Their own docs channels         | The rendered rule file, and the 12,000-character cap Windsurf truncates at                                                                |

**The honest line, and it leads.** `agents[]` in a manifest means somebody ran
it with that agent. Today every entry claims one agent. Posting to a channel
for an agent nobody has verified is a claim the catalog cannot back, so each
of these waits for a recorded `agent-verification` pull request — which is
also the cheapest way for somebody in that community to contribute.

**Materials per agent**, when the verification exists: one command, one
screenshot of the file it wrote, and the sentence about what `render` is for —
content written once, agent-specific files generated, never a hand-written
copy per agent.
