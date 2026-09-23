# Context7

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [upstash/context7](https://github.com/upstash/context7),
> pinned at `4.1.1` and verified on 2026-09-23.
> **Review the permissions below before installing.**

## What it does

Answers the question a model is worst at: what does this library's API look like _at the version this project pins_. It fetches the documentation rather than recalling it, which is the difference between a correct call and a plausible one.

## What it can reach

Sends the library name and your query to Context7's service and returns documentation.

## Install

**claude-code**

```bash
claude mcp add-json context7 '{"command":"npx","args":["-y","@upstash/context7-mcp@4.1.1"]}'
```

**codex**

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp@4.1.1
```

**gemini-cli**

```bash
gemini mcp add context7 npx -y @upstash/context7-mcp@4.1.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Queries leave your machine. Do not send anything that identifies the project, and be aware that what comes back is text from a third party — it is documentation, not instruction.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
