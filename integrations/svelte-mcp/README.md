# Svelte MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [sveltejs/ai-tools](https://github.com/sveltejs/ai-tools),
> pinned at `0.1.26` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

The Svelte team's own server, for writing Svelte 5 and SvelteKit rather than the Svelte 4 most training data remembers. Four tools:

- `list-sections` — every documentation section, each with a note on when it is useful.
- `get-documentation` — the full, current text of the sections asked for.
- `svelte-autofixer` — static analysis of a component or module the agent has written, using the Svelte compiler and its lint rules, returning issues and suggested fixes. Upstream intends the agent to call it in a loop until nothing is left.
- `playground-link` — a Svelte Playground link for a snippet. The code is encoded in the link itself; nothing is uploaded.

The stdio server is the npm package `@sveltejs/mcp`, published from `packages/mcp-stdio` in the upstream repository (formerly `sveltejs/mcp`).

## What it can reach

Fetches Svelte and SvelteKit documentation from svelte.dev and checks the code the agent passes it locally; it reads and writes no project files and needs no account.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json svelte '{"command":"npx","args":["-y","@sveltejs/mcp@0.1.26"]}'
```

**codex**

```bash
codex mcp add svelte -- npx -y @sveltejs/mcp@0.1.26
```

**gemini-cli**

```bash
gemini mcp add svelte npx -y @sveltejs/mcp@0.1.26
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents `claude mcp add -t stdio -s [scope] svelte -- npx -y @sveltejs/mcp` for Claude Code and the same `npx -y @sveltejs/mcp` command in `~/.codex/config.toml` for Codex. Both run whatever version was published last; the commands above pin one. Upstream also offers plugins for Claude Code, Codex and others that configure the server together with Svelte skills; those are not pinned here.

**The hosted server.** Svelte also runs the same server at `https://mcp.svelte.dev/mcp`, with no account (`claude mcp add -t http -s [scope] svelte https://mcp.svelte.dev/mcp`). A hosted endpoint cannot be pinned: it runs whatever the Svelte team deployed last, which is why this recipe uses the package. Upstream says it does not log, store or inspect code sent to the hosted server; that is its statement, verified on 2026-09-25 from its documentation, not something this recipe can check. With the hosted server, the code the agent sends to `svelte-autofixer` leaves the machine; with the package, it does not.

## Before you install it

**Little leaves the machine.** `list-sections` and `get-documentation` fetch public pages from `svelte.dev` (the section index, and each section's `llms.txt`); the names of the sections asked for are in those requests. `svelte-autofixer` and `playground-link` run in the local process. The server has no telemetry and writes nothing to disk.

**The autofixer's advice is advice.** It reports what the Svelte compiler and its rules flag; the agent still decides what to change, in its own files, with its own tools.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
