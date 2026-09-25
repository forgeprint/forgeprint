# Figma Context MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP),
> pinned at `0.13.2` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Turns a design into data the agent can implement against — layout, spacing, colours, component names — rather than a screenshot it has to guess from.

## What it can reach

Reads the Figma files the access token can reach, through Figma's API.

## Secrets it needs

- `FIGMA_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json figma '{"command":"npx","args":["-y","figma-developer-mcp@0.13.2","--stdio"],"env":{"FIGMA_API_KEY":"${FIGMA_API_KEY}"}}'
```

**codex**

```bash
codex mcp add figma --env FIGMA_API_KEY=$FIGMA_API_KEY -- npx -y figma-developer-mcp@0.13.2 --stdio
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["FIGMA_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add figma -e 'FIGMA_API_KEY=${FIGMA_API_KEY}' npx -y figma-developer-mcp@0.13.2 --stdio
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

This is a community project, not Figma's own. Read it before you install it, and give it a read-only personal access token: a design file is usually somebody else's work and an agent does not need to write to it.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
