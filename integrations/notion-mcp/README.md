# Notion MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server),
> pinned at `2.5.2` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Specifications, decision logs and requirements that live in Notion, available to the agent without copy and paste. Notion's own model helps here: a page is reachable only once it has been shared with the integration.

## What it can reach

Reads and writes the pages and databases explicitly shared with the integration.

## Secrets it needs

- `NOTION_TOKEN` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json notion '{"command":"npx","args":["-y","@notionhq/notion-mcp-server@2.5.2"],"env":{"NOTION_TOKEN":"${NOTION_TOKEN}"}}'
```

**codex**

```bash
codex mcp add notion --env NOTION_TOKEN=$NOTION_TOKEN -- npx -y @notionhq/notion-mcp-server@2.5.2
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["NOTION_TOKEN"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add notion -e 'NOTION_TOKEN=${NOTION_TOKEN}' npx -y @notionhq/notion-mcp-server@2.5.2
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Sharing is the control, so share narrowly — a page, not a workspace. The token can write, so an agent can change a document somebody else depends on; decide whether that is wanted before granting it.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
