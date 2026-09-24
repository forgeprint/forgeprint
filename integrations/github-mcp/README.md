# GitHub MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [github/github-mcp-server](https://github.com/github/github-mcp-server),
> pinned at `v1.12.2` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

The one most projects install first. Issues, pull requests, Actions runs and code search, against whatever the token can see. GitHub hosts it, so there is nothing to run locally.

## What it can reach

Reads and writes every repository the token can reach: issues, pull requests, workflow runs and file contents.

## Secrets it needs

- `GITHUB_PERSONAL_ACCESS_TOKEN` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp/","headers":{"Authorization":"Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"}}'
```

**gemini-cli**

```bash
gemini mcp add github https://api.githubcopilot.com/mcp/ --transport http --header 'Authorization: Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}'
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

GitHub Copilot CLI ships with this server already configured, so there is nothing to add there.

## Before you install it

The token is the whole boundary. A classic token with `repo` scope reaches every repository you can reach, including private ones belonging to organisations you are a member of. Use a fine-grained token scoped to the repositories the work actually touches, and give it read access unless a write is the point.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
