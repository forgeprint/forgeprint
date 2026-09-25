# Grafana MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [grafana/mcp-grafana](https://github.com/grafana/mcp-grafana),
> pinned at `1.5.1` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Puts the team's own observability in front of the agent: it searches dashboards, runs PromQL and LogQL against the datasources, and reads alert rules, incidents and on-call schedules. Debugging from the graph and the log line rather than from somebody's description of them.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed. The package wraps the same Go binary the upstream ships as a release and as the `grafana/mcp-grafana` Docker image.

## What it can reach

Reads dashboards, datasources, alert rules, incidents and on-call data, and runs read queries against the datasources, in the Grafana instance the service account can reach; write tools are not registered.

## Secrets it needs

- `GRAFANA_URL` — the address of the Grafana instance, such as `http://localhost:3000` or your Grafana Cloud stack URL. Not a secret, but it has to be set.
- `GRAFANA_SERVICE_ACCOUNT_TOKEN` — a token for a Grafana service account with the **Viewer** role (see below). Create it in Grafana, put it in your environment, and **the agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json grafana '{"command":"uvx","args":["mcp-grafana==1.5.1","--disable-write","--usage-stats=disabled"],"env":{"GRAFANA_URL":"${GRAFANA_URL}","GRAFANA_SERVICE_ACCOUNT_TOKEN":"${GRAFANA_SERVICE_ACCOUNT_TOKEN}"}}'
```

**codex**

```bash
codex mcp add grafana --env "GRAFANA_URL=$GRAFANA_URL" --env "GRAFANA_SERVICE_ACCOUNT_TOKEN=$GRAFANA_SERVICE_ACCOUNT_TOKEN" -- uvx mcp-grafana==1.5.1 --disable-write --usage-stats=disabled
```

**gemini-cli**

```bash
gemini mcp add grafana -e 'GRAFANA_URL=$GRAFANA_URL' -e 'GRAFANA_SERVICE_ACCOUNT_TOKEN=$GRAFANA_SERVICE_ACCOUNT_TOKEN' uvx mcp-grafana==1.5.1 --disable-write --usage-stats=disabled
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Where the token ends up differs by agent. Claude Code stores `${GRAFANA_SERVICE_ACCOUNT_TOKEN}` and expands it when the server starts. Gemini CLI does the same, which is why its `-e` values are in single quotes. Codex CLI stores what the shell expanded, so the token is written into `~/.codex/config.toml` in plain text; if you would rather it were not, list the variable under the server's `env_vars` in that file instead of passing `--env`.

## Before you install it

**Use a Viewer service account, not Editor.** The upstream README suggests the built-in Editor role as the quick way to make most tools work. Editor can change dashboards, folders, alert rules, silences and annotations, and create incidents; that is more than an agent reading observability data needs. Every command above passes `--disable-write`, which stops the server registering its write tools, and a Viewer account means the Grafana API refuses a write as well, so a dropped flag or a generic API call does not become a changed alert rule. The tools that need Editor under a Viewer account — the Sift investigations and incident updates — are write tools that `--disable-write` already removes.

**Read queries still reach everything the account can see.** PromQL, LogQL and the other query languages that cannot express a write stay available, and logs routinely contain user data. What the agent reads leaves your organisation if the model is not local. Scope the service account to the folders and datasources the work touches, or add `--disable-query` for an agent that should only see what exists, not the data in it. The raw-SQL tools (`query_sql`, `query_influxdb`) are removed by `--disable-write`; do not add `--enable-query` unless the datasource credentials themselves are read-only.

**Usage statistics are off, and stay off.** `1.5.1` reports nothing by default, but the upstream says a later release will switch reporting on by default. The commands pass `--usage-stats=disabled` so moving the pin does not change that.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
