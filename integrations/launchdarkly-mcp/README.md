# LaunchDarkly MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [launchdarkly/mcp-server](https://github.com/launchdarkly/mcp-server),
> pinned at `0.6.2` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

LaunchDarkly's own MCP server, run locally from the npm package `@launchdarkly/mcp-server`. The agent reads the feature flags a change depends on — their variations, targeting and status in each environment — and where the code references them, instead of guessing from a flag key in the source.

Twenty tools, each tagged by the package as a read or a write:

- **Read** — `list-feature-flags`, `get-feature-flag`, `get-flag-status-across-environments`, `get-environments`, `get-code-references`, `get-audit-log-entries`, `list-ai-configs`, `get-ai-config`, `get-ai-config-targeting`, `get-ai-config-variation`.
- **Write** — `create-feature-flag`, `update-feature-flag`, `delete-feature-flag`, and create, update, update-targeting and delete for AI Configs and their variations.

The commands below pass `--scope read`, which mounts the read tools only.

## What it can reach

As installed, reads feature flags, flag status, AI Configs, environments, code references and the audit log that the access token can see. Without --scope read it also creates, updates, toggles and deletes flags and AI Configs, in any environment the token reaches.

## Secrets it needs

- `LD_ACCESS_TOKEN` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

Create an API access token on LaunchDarkly's Authorization page.
For the read-only commands below, give it the **Reader** role. If the agent
is to write, give it a custom role that allows only the projects it works on
and denies production environments, rather than Writer or Admin.

**The server reads the token only from the command line.** In `0.6.2`,
`mcp start` sends whatever `--api-key` holds and never falls back to an
environment variable, so each command passes the variable's name in its
arguments:

- **Claude Code** expands `${LD_ACCESS_TOKEN}` in the arguments when it starts
  the server; only the name is stored.
- **Gemini CLI** stores `${LD_ACCESS_TOKEN}` as written — keep the single
  quotes so your shell does not expand it — and expands it at startup.
- **Codex is not listed.** `codex mcp add` has no way to pass a variable by
  name, so the shell would expand it and the key would be written in plain
  text to `~/.codex/config.toml`. Codex's `env_vars` cannot help, because
  this server ignores its environment.

On every agent the key ends up in the server's command line while it runs,
where other processes of the same user can read it.

## Install

**claude-code**

```bash
claude mcp add-json launchdarkly '{"command":"npx","args":["-y","--package","@launchdarkly/mcp-server@0.6.2","--","mcp","start","--scope","read","--api-key","${LD_ACCESS_TOKEN}"]}'
```

**gemini-cli**

```bash
gemini mcp add launchdarkly npx -- -y --package @launchdarkly/mcp-server@0.6.2 -- mcp start --scope read --api-key '${LD_ACCESS_TOKEN}'
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

The Gemini CLI command puts `--` right after `npx` because `gemini mcp add`
has a `--scope` option of its own; everything after that `--` is passed to
the server unchanged. The upstream documents the same `npx` arguments without
a version and with the key written into the file; the commands above pin the
version and pass the key by name.

On LaunchDarkly's EU or Federal instances, add `--server-url https://app.eu.launchdarkly.com`
or `--server-url https://app.launchdarkly.us` after `mcp start`.

**The hosted server.** LaunchDarkly recommends its hosted server,
`https://mcp.launchdarkly.com/mcp/launchdarkly`, wherever it is available —
everywhere except the EU and Federal instances — and calls it more complete
and more often updated than this package. It signs in with OAuth
(`claude mcp add --transport http launchdarkly https://mcp.launchdarkly.com/mcp/launchdarkly`
in LaunchDarkly's docs). It cannot be pinned and is not what this recipe
installs.

## Before you install it

**A flag is production.** `update-feature-flag` can turn a flag on or off,
change its rollout and change its targeting in any environment the token can
reach, and the change reaches users with no deploy in between. Remove `--scope read` only when changing flags is the point, give the
token a role that cannot touch production, and approve every write tool call
yourself.

**Deletes are real.** `delete-feature-flag` and the AI Config deletes remove
the flag or config from every environment.

**Narrow further if you like.** `--tool <name>` (repeatable) mounts only the
tools you name, for example `--tool list-feature-flags --tool get-feature-flag`.

**What leaves the machine.** The server calls the LaunchDarkly API
(`app.launchdarkly.com`, or the instance you set) and nothing else; no usage
telemetry was found in the package.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
