# Filesystem MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem),
> pinned at `2026.8.31` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

The reference server most people install, and the one whose permission model is most worth reading. The directories are arguments: what is not listed is not reachable.

## What it can reach

Reads and writes every file under the directories passed as arguments, with the privileges of the user running it.

## Install

**claude-code**

```bash
claude mcp add-json filesystem '{"command":"npx","args":["-y","@modelcontextprotocol/server-filesystem@2026.8.31","/path/to/allowed/dir"]}'
```

**codex**

```bash
codex mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem@2026.8.31 /path/to/allowed/dir
```

**gemini-cli**

```bash
gemini mcp add filesystem npx -y @modelcontextprotocol/server-filesystem@2026.8.31 /path/to/allowed/dir
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Everything hangs on those arguments. A home directory as the argument is read and write access to the SSH keys, the cloud credentials and the browser profiles. Name the project directory and nothing above it, and remember the agent already has its own file tools — install this when something _other_ than the coding agent needs file access.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
