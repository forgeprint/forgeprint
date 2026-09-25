# Nx MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [nrwl/nx-console/tree/master/apps/nx-mcp](https://github.com/nrwl/nx-console/tree/master/apps/nx-mcp),
> pinned at `0.25.0` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Nx's own MCP server, published by the Nx team from the Nx Console repository. In an Nx monorepo it gives the agent what Nx already knows about the workspace instead of leaving it to reconstruct that from `package.json` files:

- `nx_workspace` and `nx_workspace_path` — the project graph and `nx.json`.
- `nx_project_details` — one project's full configuration: targets, inputs, outputs, tags.
- `nx_generators` and `nx_generator_schema` — which generators exist and what options they take.
- `nx_available_plugins` — the Nx plugins available to add.
- `nx_current_running_tasks_details` and `nx_current_running_task_output` — what `nx` is running in a terminal right now, and its output.
- `nx_docs` — Nx documentation relevant to a question.
- `nx_visualize_graph` — asks a running Nx Console editor extension to show the graph; without one it does nothing useful.

The first six are hidden by default ("minimal mode"), because upstream expects them to be covered by the agent skills its `nx configure-ai-agents` command installs. This recipe installs no skills, so every command passes `--no-minimal` to keep them.

Start the agent from the workspace root: without a path argument the server uses the current directory, and outside a workspace only `nx_docs` and `nx_available_plugins` are available.

## What it can reach

Reads the Nx workspace it starts in (project graph, project configuration, generators, output of running tasks) and sends documentation questions to nx.dev; it changes no source files, and NX_NO_CLOUD keeps its Nx Cloud tools off.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json nx-mcp '{"command":"npx","args":["-y","nx-mcp@0.25.0","--no-minimal","--disableTelemetry"],"env":{"NX_NO_CLOUD":"true"}}'
```

**codex**

```bash
codex mcp add nx-mcp --env "NX_NO_CLOUD=true" -- npx -y nx-mcp@0.25.0 --no-minimal --disableTelemetry
```

**gemini-cli**

```bash
gemini mcp add nx-mcp -e "NX_NO_CLOUD=true" npx -y nx-mcp@0.25.0 --no-minimal --disableTelemetry
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents `claude mcp add nx-mcp npx nx mcp` for Nx 21.4 and later. `nx mcp` is a wrapper: it runs `nx-mcp@latest` through your package manager, so it installs whatever was published last. The commands above run the same package at a pinned version instead. For other clients upstream says to run the same command; Codex and Gemini CLI use the shapes in `schema/agents.yaml`.

## Before you install it

**It runs your workspace's Nx.** To build the project graph the server loads the `nx` installed in the workspace and asks it for the graph, which runs the workspace's Nx plugins and writes Nx's usual cache under `.nx/`, as any `nx` command does. Install it only in workspaces whose plugins you would run anyway.

**Nx Cloud is off.** When a workspace is connected to Nx Cloud (an `nxCloudId` or access token in `nx.json`, `nx-cloud.env` or the environment), the server adds three tools and a set of resources that use the workspace's own Nx Cloud credentials: `ci_information` and `ci_task_output` read CI runs, and `update_self_healing_fix` applies, rejects or reruns a self-healing fix in Nx Cloud. Every command sets `NX_NO_CLOUD=true`, Nx's own switch, so the server treats the workspace as not connected and none of them appear. To use them, drop the variable knowing that one of them changes things in Nx Cloud; to keep the read tools only, add `--tools "*" "!update_self_healing_fix"` instead.

**Documentation questions leave the machine.** `nx_docs` sends the question, and any context the agent passes with it, to `https://nx.dev/api/query-ai-embeddings`. Do not paste anything into a docs question you would not post publicly.

**Usage statistics.** Unless told not to, the server sends an event for every tool call, with a random per-session ID, the operating system and the server and Nx versions, to Google Analytics. Every command above passes `--disableTelemetry`, which turns that off; `"disableTelemetry": true` in `.nx/nx-mcp-config.json` does the same.

**The last release is from 2026-04-30.** The repository is active, but `0.25.0` is the newest version on npm. Check for a newer one before installing, and move the pin when there is one.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
