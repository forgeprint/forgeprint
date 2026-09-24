# Chrome DevTools MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp),
> pinned at `1.10.1` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Debugging rather than driving. The agent reads what Chrome already knows: console errors, the network waterfall, a performance trace. It is the difference between an agent guessing why a page is slow and an agent reading the trace.

## What it can reach

Drives a Chrome instance: navigates, runs JavaScript in its pages, and reads their console, network traffic and performance traces.

## Install

**claude-code**

```bash
claude mcp add-json chrome-devtools '{"command":"npx","args":["-y","chrome-devtools-mcp@1.10.1","--no-usage-statistics"]}'
```

**codex**

```bash
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@1.10.1 --no-usage-statistics
```

**gemini-cli**

```bash
gemini mcp add chrome-devtools npx -y chrome-devtools-mcp@1.10.1 --no-usage-statistics
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

The network log contains every request the page made, headers included. If the browser is signed in to anything, those tokens are in what the agent reads. Use a profile that is signed in to nothing.

It can also run JavaScript in the pages it opens. If the agent only needs to read, start it with `--no-javascript-evaluation`, which since 1.9.0 also covers navigations and init scripts.

**Usage statistics.** Google collects tool success rates, latency and environment details from this server, on by default. Every command above passes `--no-usage-statistics`, which turns that off; setting `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` does the same. It is separate from Chrome's own usage statistics.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
