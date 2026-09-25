# Vercel MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else runs and maintains.
> The upstream is [Vercel's MCP documentation](https://vercel.com/docs/agent-resources/vercel-mcp),
> and the server itself is hosted by Vercel at `https://mcp.vercel.com`.
> **A hosted server cannot be pinned.** There is no public source repository
> and no version: Vercel can change the tools behind the endpoint at any time,
> and still labels it a **public beta**. What is written here was verified on
> 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Vercel's own remote MCP server. The agent reads what Vercel knows about a project — its deployments, the build logs of the one that failed, runtime logs and errors, Web Analytics — instead of the user pasting them in, and searches Vercel's documentation. Vercel hosts it, so there is nothing to run locally.

The tool groups, as Vercel's [tools reference](https://vercel.com/docs/agent-resources/vercel-mcp/tools) lists them on 2026-09-25:

- **Documentation** — `search_vercel_documentation`, which works without signing in.
- **Projects and deployments** — `list_teams`, `list_projects`, `get_project`, `list_deployments`, `get_deployment`, `get_deployment_build_logs`, `get_runtime_logs`, `get_runtime_errors`, and `deploy_to_vercel`, which deploys.
- **Web Analytics and agent runs** — visitors, page views and custom events, and traces of agent runs.
- **Access** — `get_access_to_vercel_url`, which creates a temporary shareable link to a protected deployment, and `web_fetch_vercel_url`, which fetches a protected deployment's content.
- **Toolbar** — reads comment threads on preview deployments, and replies to, resolves, edits and reacts to them.
- **Domains and purchases** — domain availability and price, a quote tool, and `buy_domain`, `buy_credits`, `buy_pro` and `buy_addon`.
- **Design import** and a `use_vercel_cli` helper that points the agent at the Vercel CLI.

## What it can reach

Acts as your Vercel user on the teams you authorise: reads projects, deployments, logs and analytics, deploys files to preview or production, opens links past deployment protection, and can buy domains, credits and plan upgrades.

## Secrets it needs

None in the install command. The server uses **OAuth**: the first time the
agent connects, a browser window opens and you sign in to Vercel yourself and
approve that client. Complete the flow in your agent — `/mcp` in Claude Code;
Codex opens the browser when the server is added (`codex mcp login vercel`
repeats it); in Gemini CLI the bridge below opens it on first start.
**The agent never signs in for you.**

## Install

**claude-code**

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

**codex**

```bash
codex mcp add vercel --url https://mcp.vercel.com
```

**gemini-cli**

```bash
gemini mcp add vercel npx -y mcp-remote@0.14.3 https://mcp.vercel.com
```

The Claude Code and Codex commands are the ones Vercel documents. For Gemini
CLI, Vercel documents only a `settings.json` entry that runs the
[`mcp-remote`](https://github.com/punkpeye/mcp-remote) bridge with no version;
the command above writes the same entry with the bridge pinned at `0.14.3`.
The bridge is a separate package from a different maintainer, it holds the
OAuth token for the session, and versions before `0.1.16` had a critical
command-injection flaw (CVE-2025-6514) — keep the pin. Vercel accepts only
clients it has reviewed, so a Gemini CLI connection without the bridge was not
assumed to work.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Vercel also offers `npx add-mcp https://mcp.vercel.com`, which configures every
agent it detects at once; it runs an unpinned package and is not used here.

## Before you install it

**The agent gets your account.** Vercel's own words: connecting grants the AI
system the same access as your Vercel user account. There is no read-only
endpoint and no per-project scope in the URL; the boundary is which teams you
approve in the OAuth screen and the role you hold on each. Use an account or
team role that can do no more than the work needs.

**It deploys.** `deploy_to_vercel` takes a file tree and a target — `preview`
or `production` — creates the project if it does not exist, and builds it. The
files the agent passes are uploaded to Vercel. Keep the client's per-tool
approval on for this tool, and read the target before you approve.

**It spends money.** The purchase tools buy a domain, prepaid credits, the
Pro plan or an add-on, charged to the team's payment method **immediately and
non-refundably**. Every purchase needs a quote first and a second call with
`confirm: true`, and a team role with billing access; Vercel is rolling these
tools out gradually, so they may not appear yet. Vercel asks you to enable a
confirmation prompt for any call with `confirm: true` — do, and never
auto-approve the `buy_*` tools.

**It opens protected deployments.** `get_access_to_vercel_url` creates a
temporary shareable link that bypasses deployment protection. Anyone who gets
that link can open the deployment until it expires.

**It writes where teammates read.** The toolbar tools reply to, edit, react to
and resolve comment threads on preview deployments, under your name.

**Prompt injection.** Build logs, runtime logs and deployment content are text
other people and other systems wrote. Vercel's security guidance names this
risk directly: an instruction hidden there can ask the agent to copy logs
somewhere else. Keep human confirmation on.

## Updating

There is no pin to move: the server is whatever Vercel runs today. Re-read
Vercel's MCP page and its tools reference, and change `verified_on`, the
permissions and the install commands together in one pull request. Moving the
`mcp-remote` pin for Gemini CLI follows the usual rule: read its release notes
first.
