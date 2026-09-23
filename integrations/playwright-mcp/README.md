# Playwright MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp),
> pinned at `0.0.82` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Gives an agent a real browser. It navigates, fills forms, clicks, and reads the page as an accessibility tree rather than as pixels, which is why it works without a vision model.

## What it can reach

Launches a browser on this machine and visits whatever the agent asks it to, including local services.

## Install

**claude-code**

```bash
claude mcp add-json playwright '{"command":"npx","args":["-y","@playwright/mcp@0.0.82"]}'
```

**codex**

```bash
codex mcp add playwright -- npx -y @playwright/mcp@0.0.82
```

**gemini-cli**

```bash
gemini mcp add playwright npx -y @playwright/mcp@0.0.82
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

It opens a browser with the agent's instructions and no human between the two. A page the agent visits can contain text aimed at the agent; treat what comes back as data, never as instructions. Point it at a development server, not at a session logged into anything that matters.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
