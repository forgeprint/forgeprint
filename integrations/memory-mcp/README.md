# Memory MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory),
> pinned at `2026.8.31` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Persistence between sessions, as entities and relations rather than as a transcript. Useful for a long-running assistant that has to remember decisions rather than re-derive them.

## What it can reach

Reads and writes a knowledge graph in a local file; reaches nothing else.

## Install

**claude-code**

```bash
claude mcp add-json memory '{"command":"npx","args":["-y","@modelcontextprotocol/server-memory@2026.8.31"]}'
```

**codex**

```bash
codex mcp add memory -- npx -y @modelcontextprotocol/server-memory@2026.8.31
```

**gemini-cli**

```bash
gemini mcp add memory npx -y @modelcontextprotocol/server-memory@2026.8.31
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Whatever the agent decides is worth remembering ends up in a file on disk, including things a user said in passing. It is a plain file with no encryption and no expiry, so treat it as a document somebody could read, and delete it when the work ends.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
