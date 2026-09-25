# ClickHouse MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [ClickHouse/mcp-clickhouse](https://github.com/ClickHouse/mcp-clickhouse),
> pinned at `0.7.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

ClickHouse's own MCP server. Three tools: `list_databases`, `list_tables` (with columns and the `CREATE TABLE` statement, paged), and `run_query`, which runs SQL with optional typed parameters and also takes `EXPLAIN ESTIMATE` and `DESCRIBE` to check what a query would read before running it. For an agent writing analytics SQL against the real schema rather than a guessed one.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed; upstream recommends Python 3.12. It starts on the stdio transport, which needs no authentication of its own. The optional embedded chDB engine is off by default and not enabled here.

## What it can reach

Reads every database and table the ClickHouse user can read and runs SQL with the readonly=1 setting; it writes only if CLICKHOUSE_ALLOW_WRITE_ACCESS is set to true, which these commands do not.

## Secrets it needs

- `CLICKHOUSE_HOST` — the hostname of the ClickHouse server. Not a secret, but it has to be set. The server connects over HTTPS on port 8443 by default; for a plain-HTTP local instance, also set `CLICKHOUSE_SECURE=false`.
- `CLICKHOUSE_USER` — a ClickHouse user created for the agent (see below).
- `CLICKHOUSE_PASSWORD` — that user's password. Put it in your environment; **the agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json clickhouse '{"command":"uvx","args":["mcp-clickhouse==0.7.0"],"env":{"CLICKHOUSE_HOST":"${CLICKHOUSE_HOST}","CLICKHOUSE_USER":"${CLICKHOUSE_USER}","CLICKHOUSE_PASSWORD":"${CLICKHOUSE_PASSWORD}","CLICKHOUSE_ALLOW_WRITE_ACCESS":"false"}}'
```

**codex**

```bash
codex mcp add clickhouse --env "CLICKHOUSE_HOST=$CLICKHOUSE_HOST" --env "CLICKHOUSE_USER=$CLICKHOUSE_USER" --env "CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD" --env "CLICKHOUSE_ALLOW_WRITE_ACCESS=false" -- uvx mcp-clickhouse==0.7.0
```

**gemini-cli**

```bash
gemini mcp add clickhouse -e 'CLICKHOUSE_HOST=$CLICKHOUSE_HOST' -e 'CLICKHOUSE_USER=$CLICKHOUSE_USER' -e 'CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD' -e 'CLICKHOUSE_ALLOW_WRITE_ACCESS=false' uvx mcp-clickhouse==0.7.0
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Where the password ends up differs by agent. Claude Code stores `${CLICKHOUSE_PASSWORD}` and expands it when the server starts. Gemini CLI does the same, which is why its `-e` values are in single quotes. Codex CLI stores what the shell expanded, so the password is written into `~/.codex/config.toml` in plain text; if you would rather it were not, list the variables under the server's `env_vars` in that file instead of passing `--env`.

## Before you install it

**Read-only is the default, and ClickHouse enforces it.** With `CLICKHOUSE_ALLOW_WRITE_ACCESS` unset or `false`, every query is sent with ClickHouse's `readonly=1` setting, so the database itself refuses a write. The commands set it to `false` explicitly so a change of default in a later release does not change this recipe. Setting it to `true` allows `CREATE`, `INSERT` and `ALTER`; destructive statements such as `DROP`, `TRUNCATE` and `DELETE` then need `CLICKHOUSE_ALLOW_DROP=true` as well. Upstream says plainly that this second check is a best-effort guard in the MCP server, not a security boundary.

**The user's grants are the real boundary.** Upstream's own caution: treat the MCP user like any external client and grant it only what it needs. Create a user for the agent with `SELECT` on the databases the work touches, not the `default` user, and never an admin.

**Queries cost what they cost.** `readonly=1` does not stop a full scan of a billion-row table. On ClickHouse Cloud that is compute you pay for, and on a shared cluster it is load other people feel. Point it at a development service or give the user a settings profile with `max_execution_time` and `max_result_rows` limits.

**The data leaves with the answer.** Every row a query returns goes into the conversation, and to the model provider if the model is not local.

No telemetry was found in the upstream's documentation or configuration reference.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
