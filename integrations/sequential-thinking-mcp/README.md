# Sequential Thinking MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/sequentialthinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking),
> pinned at `2026.8.31` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

One tool, `sequential_thinking`. The model calls it with one step of its reasoning — the thought, its number, an estimate of how many steps remain, and optionally which earlier step it revises or branches from. The server stores the step and answers with counters: the step number, the total, whether another step is needed, and the branch names so far. It does not reason, check anything or call anything. It is a structured scratchpad, and what it changes is the shape of the model's output, not what the model can reach.

Whether that helps depends on the model. Models with their own extended reasoning already do this internally, and for them the tool mostly adds round trips. It is most often installed for models without that, or to make a plan's revisions visible in the tool log. Try the same task with and without it before keeping it.

This recipe runs the upstream's npm package through `npx`, so it needs Node.js installed.

It is one of the MCP steering group's reference servers. Upstream describes them as reference implementations and educational examples, not production-ready solutions.

## What it can reach

Keeps the thoughts the model sends it in memory for the session and returns a count; it reads and writes no file, network or account.

## Install

**claude-code**

```bash
claude mcp add-json sequential-thinking '{"command":"npx","args":["-y","@modelcontextprotocol/server-sequential-thinking@2026.8.31"],"env":{"DISABLE_THOUGHT_LOGGING":"true"}}'
```

**codex**

```bash
codex mcp add sequential-thinking --env DISABLE_THOUGHT_LOGGING=true -- npx -y @modelcontextprotocol/server-sequential-thinking@2026.8.31
```

**gemini-cli**

```bash
gemini mcp add sequential-thinking -e DISABLE_THOUGHT_LOGGING=true npx -y @modelcontextprotocol/server-sequential-thinking@2026.8.31
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**Thought logging is off in every command.** By default the server prints every thought, in full, to its standard error, which the agent host usually writes to its MCP log files. Those thoughts can quote code, file contents and anything else in the conversation. `DISABLE_THOUGHT_LOGGING=true`, which the upstream documents, stops that; the tool works the same without the log.

**Nothing leaves the machine through it,** and nothing persists: the history lives in the server's memory and is gone when the agent stops it. It grows for as long as the session runs, one entry per thought.

There is no telemetry and there are no secrets.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
