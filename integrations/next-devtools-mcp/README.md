# Next.js DevTools MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [vercel/next-devtools-mcp](https://github.com/vercel/next-devtools-mcp),
> pinned at `0.4.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Connects the agent to the Next.js dev server that is already running. It finds the server, then asks it for the current build, runtime and type errors, the routes and pages, the dev log, and which file a Server Action ID belongs to. Fixing the error the app is actually showing, rather than one reconstructed from a screenshot.

Since `0.4.0` it is a thin connector: the runtime tools live in Next.js itself (at `/_next/mcp`, on by default from Next.js 16), and this server proxies them. It needs Node.js 20.19 or a newer LTS, and a Next.js 16+ dev server for anything beyond the docs pointer.

## What it can reach

Probes local ports for Next.js dev servers and calls the runtime tools they expose at /_next/mcp, which read errors, routes, logs and project metadata; it needs no credentials.

## Secrets it needs

None. `NEXT_TELEMETRY_DISABLED` in the commands below is a setting, not a secret.

## Install

**claude-code**

```bash
claude mcp add-json next-devtools '{"command":"npx","args":["-y","next-devtools-mcp@0.4.0"],"env":{"NEXT_TELEMETRY_DISABLED":"1"}}'
```

**codex**

```bash
codex mcp add next-devtools --env NEXT_TELEMETRY_DISABLED=1 -- npx -y next-devtools-mcp@0.4.0
```

**gemini-cli**

```bash
gemini mcp add next-devtools -e NEXT_TELEMETRY_DISABLED=1 npx -y next-devtools-mcp@0.4.0
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**Pinned where the vendor is not.** The upstream's install instructions use `next-devtools-mcp@latest`; this recipe pins `0.4.0`. The 0.3.x line had more tools (`init`, `upgrade_nextjs_16`, `enable_cache_components`) that 0.4.0 removed, so an unpinned install already changed under people once.

**Telemetry is off.** The server sends anonymous usage events — tool names, error messages, OS and Node.js version — to Next.js telemetry by default. The commands set `NEXT_TELEMETRY_DISABLED=1` in the server's environment, which the upstream source checks before sending anything. It still keeps an anonymous ID and a debug log under `~/.next-devtools-mcp/`.

**Two tools hand the agent commands to run.** `browser_eval` does not drive a browser: when the `agent-browser` CLI is missing it tells the agent to install it globally with npm, unpinned. `nextjs_docs`, on a Next.js older than 16, recommends `npx @next/codemod@latest upgrade latest`, which is a major-version upgrade of your project. Both are somebody else's instructions arriving as tool output; treat them as data, and decide yourself whether either runs.

**It talks to the dev servers on this machine.** `nextjs_index` probes common local ports, and what comes back — errors, logs, routes — comes from the running dev server. The dev log can include whatever the app printed, so treat it like any other log that leaves the machine if the model is not local.

npm and the upstream README give the licence as MIT; the repository itself carries no licence file that GitHub detects.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
