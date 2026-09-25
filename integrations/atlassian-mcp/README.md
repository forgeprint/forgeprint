# Atlassian Rovo MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else runs and maintains.
> The upstream is [atlassian/atlassian-mcp-server](https://github.com/atlassian/atlassian-mcp-server),
> and the server itself is hosted by Atlassian at `https://mcp.atlassian.com/v2/mcp`.
> **A hosted server cannot be pinned.** `v2` is the endpoint version in the URL,
> not a release: Atlassian can change the tools behind it at any time, without a
> new version. What is written here was verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Atlassian's own remote MCP server. Jira work items, Confluence pages, Compass components, and — where the site has them — Bitbucket Cloud, Jira Service Management, Loom, Goals, Projects and Teams, reached from the agent with the same access the user already has in the browser. Atlassian hosts it, so there is nothing to run locally.

## What it can reach

Reads and writes Jira, Confluence, Compass, Bitbucket and other Atlassian Cloud data with the signed-in user's own permissions: it creates and edits work items and pages, not only reads them.

## Secrets it needs

None in the install command. The default is **OAuth 2.1**: the first time the
agent connects, a browser window opens and you sign in to Atlassian yourself.
Complete that flow in your agent — `/mcp` in Claude Code, `codex mcp login atlassian`
in Codex, `/mcp auth atlassian` in Gemini CLI. **The agent never signs in for you.**

API token authentication exists for headless setups, and it is required for the
Jira Service Management tools, but it is off until an organisation admin enables
it (Atlassian Administration → Rovo → Rovo MCP server → Authentication). If you
use it, create the token at Atlassian, give it only the scopes the work needs,
keep it in your environment, and follow Atlassian's
[API token guide](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/configuring-authentication-via-api-token/)
for the header your agent should send.

## Install

**claude-code**

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v2/mcp
```

**codex**

```bash
codex mcp add atlassian --url https://mcp.atlassian.com/v2/mcp
```

**gemini-cli**

```bash
gemini mcp add --transport http atlassian https://mcp.atlassian.com/v2/mcp
```

The Claude Code and Codex commands are the ones Atlassian documents. Atlassian
gives Gemini CLI only the server URL; the command above is Gemini CLI's own
documented form for a remote HTTP server, which discovers the OAuth flow from
the server.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

The agent acts as you. Whatever you can edit in Jira or Confluence, it can edit
too, and a page or work item other people depend on is one tool call away.
There is no read-only endpoint: the control is Atlassian's permission groups
(`read_*`, `write_*`, `search_*` per product), which organisation admins grant
or revoke. The destructive ones, `delete_jira` and `manage_jira`, are disabled
by default — leave them that way unless deleting is the point. Admins can also
restrict which AI tools and domains may connect, and every tool call is recorded
in the organisation's audit log. Atlassian's own advice is to require human
confirmation for any high-impact or destructive action, so keep your agent's
per-tool approval prompts on for the write tools.

The previous endpoint, `https://mcp.atlassian.com/v1/mcp`, is still accepted,
and Atlassian states that from 2027-03-01 every v1 connection automatically
exposes and uses the v2 tools. New setups should use v2, as above. The legacy
`/v1/sse` endpoint is no longer supported after 2026-06-30.

## Updating

There is no pin to move: the server is whatever Atlassian runs today. Re-read
the upstream README and the getting-started guide, and change `upstream_version`
(if the endpoint version in the URL changes), `verified_on` and the install
commands together in one pull request.
