# Time MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/time](https://github.com/modelcontextprotocol/servers/tree/main/src/time),
> pinned at `2026.8.18` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Two tools. `get_current_time` returns the current time in an IANA time zone such as `Europe/London`; `convert_time` converts a 24-hour time from one zone to another. A model has no clock of its own and tends to assume the date its training ended, so this is the small fix for "what is today's date", release notes dated in the wrong year, and cron expressions written for the wrong zone.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed.

It is one of the MCP steering group's reference servers. Upstream describes them as reference implementations and educational examples, not production-ready solutions.

## What it can reach

Reads the system clock and time zone of the machine it runs on and converts times between zones; it reaches no network, file or account.

## Install

**claude-code**

```bash
claude mcp add-json time '{"command":"uvx","args":["mcp-server-time==2026.8.18"]}'
```

**codex**

```bash
codex mcp add time -- uvx mcp-server-time==2026.8.18
```

**gemini-cli**

```bash
gemini mcp add time uvx mcp-server-time==2026.8.18
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

There is little to review: no secrets, no network, no writes. Two things are worth knowing.

**It reports the machine's own zone.** The local time zone is detected from the system. On a server or in a container that is usually UTC, which is right for timestamps and wrong for "what time is it for me". Pass `--local-timezone=<IANA name>` after the package name to set it explicitly.

**The time zone rules come from a dependency.** `uvx` pins the server at `2026.8.18`; the `tzdata` package it depends on is resolved when the environment is built. Zone rules change a few times a year, so a conversion across a recent change is only as current as that package.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
