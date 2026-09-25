# Sentry MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp),
> pinned at `0.40.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Puts the actual error in front of the agent: the stack trace, the breadcrumbs, how often it happens and since which release. Debugging from the event rather than from a description of it.

## What it can reach

Reads issues, events and stack traces, and can update issues (assign, unassign, resolve), in the Sentry organisations the token can reach.

## Secrets it needs

- `SENTRY_ACCESS_TOKEN` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json sentry '{"command":"npx","args":["-y","@sentry/mcp-server@0.40.0"],"env":{"SENTRY_ACCESS_TOKEN":"${SENTRY_ACCESS_TOKEN}"}}'
```

**codex**

```bash
codex mcp add sentry --env SENTRY_ACCESS_TOKEN=$SENTRY_ACCESS_TOKEN -- npx -y @sentry/mcp-server@0.40.0
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["SENTRY_ACCESS_TOKEN"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add sentry -e 'SENTRY_ACCESS_TOKEN=${SENTRY_ACCESS_TOKEN}' npx -y @sentry/mcp-server@0.40.0
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Sentry events routinely contain user data — request bodies, headers, occasionally a token somebody logged by accident. Everything the agent reads here may be personal data, and it leaves your organisation if the agent is not local. Scope the token to one project.

The scopes upstream documents for this transport include writes — `project:write`, `team:write` and `event:write` — because some tools change issues. If the agent only needs to read, create the token with the read scopes and expect those tools to fail, or drop tool groups with `MCP_DISABLE_SKILLS`.

The AI-powered search tools (`search_events`, `search_issues`) send your query to an LLM provider, and only work when one is configured. Without one they are simply unavailable.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
