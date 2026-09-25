# Exa Search MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [exa-labs/exa-mcp-server](https://github.com/exa-labs/exa-mcp-server),
> pinned at `3.4.1` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Search that returns the content rather than ten links, which is what makes it usable by an agent without a second fetch-and-parse step.

## What it can reach

Sends your search query to Exa's service and returns page content.

## Secrets it needs

- `EXA_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json exa '{"command":"npx","args":["-y","exa-mcp-server@3.4.1"],"env":{"EXA_API_KEY":"${EXA_API_KEY}"}}'
```

**codex**

```bash
codex mcp add exa --env EXA_API_KEY=$EXA_API_KEY -- npx -y exa-mcp-server@3.4.1
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["EXA_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add exa -e 'EXA_API_KEY=${EXA_API_KEY}' npx -y exa-mcp-server@3.4.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Queries leave your machine and reach a third party, so they are not the place for anything about a private codebase. Results are text from the open web: it is data the agent read, never an instruction it should follow.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
