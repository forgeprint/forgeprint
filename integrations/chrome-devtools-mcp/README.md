# Chrome DevTools MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp),
> pinned at `1.9.0` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Debugging rather than driving. The agent reads what Chrome already knows: console errors, the network waterfall, a performance trace. It is the difference between an agent guessing why a page is slow and an agent reading the trace.

## What it can reach

Attaches to a Chrome instance and reads its console, network traffic and performance traces.

## Install

**claude-code**

```bash
claude mcp add-json chrome-devtools '{"command":"npx","args":["-y","chrome-devtools-mcp@1.9.0"]}'
```

**codex**

```bash
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@1.9.0
```

**gemini-cli**

```bash
gemini mcp add chrome-devtools npx -y chrome-devtools-mcp@1.9.0
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

The network log contains every request the page made, headers included. If the browser is signed in to anything, those tokens are in what the agent reads. Use a profile that is signed in to nothing.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
