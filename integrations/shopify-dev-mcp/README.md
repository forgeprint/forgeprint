# Shopify Dev MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [shopify.dev/docs/apps/build/ai-toolkit](https://shopify.dev/docs/apps/build/ai-toolkit),
> pinned at `1.15.4` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Shopify's own server for building on Shopify: apps, themes, extensions and Functions. It keeps an agent on the current API surface instead of the one it remembers.

- `learn_shopify_api` — the entry point. It tells the agent which Shopify APIs the server covers, fetches current context for the one in use, and returns a conversation ID the other tools require.
- `search_docs_chunks` — searches shopify.dev and returns documentation and code examples.
- `validate_graphql_codeblocks` — checks GraphQL operations against the schema of the chosen API and version.
- `validate_component_codeblocks` — checks UI-extension and Polaris component code.
- `validate_theme` — runs Shopify's theme checks on the files the agent created or changed in a theme directory. With `LIQUID_VALIDATION_MODE=partial` it is replaced by `validate_theme_codeblocks`, which checks code blocks instead of files.
- `feedback` — a scorecard the agent is asked to file once per session on how the tools performed.

The server is the npm package `@shopify/dev-mcp`, which Shopify publishes as part of its AI Toolkit. Its source is not public: the tool list, network calls and telemetry above and below were read from the published `1.15.4` package and its README, and from the setup page this recipe links as its upstream.

## What it can reach

Sends documentation searches to shopify.dev and validates the code the agent passes it, reading theme files from a path the agent names; it needs no Shopify account and cannot reach a store.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json shopify-dev-mcp '{"command":"npx","args":["-y","@shopify/dev-mcp@1.15.4"],"env":{"OPT_OUT_INSTRUMENTATION":"true"}}'
```

**codex**

```bash
codex mcp add shopify-dev-mcp --env "OPT_OUT_INSTRUMENTATION=true" -- npx -y @shopify/dev-mcp@1.15.4
```

**gemini-cli**

```bash
gemini mcp add shopify-dev-mcp -e "OPT_OUT_INSTRUMENTATION=true" npx -y @shopify/dev-mcp@1.15.4
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents `claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest` for Claude Code and the same `@latest` command in `~/.codex/config.toml` for Codex. The commands above pin the version instead. Upstream recommends its AI Toolkit plugin where a client supports one; the plugin also installs skills and hooks, updates itself, and is not pinned here.

## Before you install it

**Tool inputs and results go to Shopify unless you opt out.** Published builds send an event for every tool call to `https://shopify.dev/mcp/usage`: the tool's inputs and its result, a conversation ID, API and package versions, and the client and model names the agent reports. The inputs are the code and questions the agent sends. Every command above sets `OPT_OUT_INSTRUMENTATION=true`, which the package checks before sending anything. Upstream's recommended way to opt out of every AI Toolkit surface at once is an empty file at `~/.config/shopify-ai-toolkit/opt-out` (`%APPDATA%\shopify-ai-toolkit\opt-out` on Windows); `DO_NOT_TRACK=1` works too.

**Searches still leave the machine.** Opting out stops the usage events, not the tools' own work: `search_docs_chunks` sends the agent's query to `shopify.dev/assistant/search`, and `learn_shopify_api` fetches current context from shopify.dev. Keep store data and secrets out of questions.

**It reads theme files it is pointed at.** `validate_theme` takes an absolute path to a theme directory and reads the files listed in the call. It changes nothing.

**One dependency floats.** The package pins its dependencies exactly except `@shopify/cli`, which it asks for as `>=3.93.1`, so the first `npx` run installs whichever Shopify CLI release is newest at that moment, alongside the pinned server. The server itself does not run the CLI against a store.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
