# Postgres MCP Pro

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [crystaldba/postgres-mcp](https://github.com/crystaldba/postgres-mcp),
> pinned at `0.3.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

A PostgreSQL server for working on a database rather than only querying it: list schemas and objects, read a table's columns, constraints and indexes, `EXPLAIN` a query (including against hypothetical indexes through `hypopg`), find the slowest statements in `pg_stat_statements`, recommend indexes for a workload, and run health checks adapted from PgHero — bloat, vacuum, unused and duplicate indexes, connections, replication. It also runs SQL through `execute_sql`.

This is the maintained community server. The reference `@modelcontextprotocol/server-postgres` is archived and deprecated on npm, and nobody patches it; do not install that one.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed. The index and statement tools need the `pg_stat_statements` and `hypopg` extensions in the database; the rest works without them.

## What it can reach

Reads every schema, table and statistics view the connection string's user can read, and runs SQL only inside read-only transactions with a 30-second limit; without --access-mode=restricted it can write.

## Secrets it needs

- `DATABASE_URI` — a PostgreSQL connection URI (`postgresql://<user>:<password>@<host>:<port>/<database>`) for a read-only role (see below). It carries the password, so keep it in your environment, not in a file the repository tracks. **The agent never enters it for you.**

## Install

**claude-code**

```bash
claude mcp add-json postgres '{"command":"uvx","args":["--with","mcp<2","postgres-mcp==0.3.0","--access-mode=restricted"],"env":{"DATABASE_URI":"${DATABASE_URI}"}}'
```

**codex**

```bash
codex mcp add postgres --env "DATABASE_URI=$DATABASE_URI" -- uvx --with "mcp<2" postgres-mcp==0.3.0 --access-mode=restricted
```

**gemini-cli**

```bash
gemini mcp add postgres -e 'DATABASE_URI=$DATABASE_URI' uvx --with 'mcp<2' postgres-mcp==0.3.0 --access-mode=restricted
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Where the connection string ends up differs by agent. Claude Code stores `${DATABASE_URI}` and expands it when the server starts. Gemini CLI does the same, which is why its `-e` value is in single quotes. Codex CLI stores what the shell expanded, so the password is written into `~/.codex/config.toml` in plain text; if you would rather it were not, list the variable under the server's `env_vars` in that file instead of passing `--env`.

## Before you install it

**Restricted mode is not the default.** Without a flag, `0.3.0` starts in `unrestricted` mode, where `execute_sql` runs anything the database user may run: `INSERT`, `DROP TABLE`, `ALTER ROLE`. Every command above passes `--access-mode=restricted`, which parses each statement and accepts only an allow-list of statement types (`SELECT`, `EXPLAIN`, `SHOW` and a few cursor and maintenance statements, but not `COMMIT` or `ROLLBACK`), runs it in a read-only transaction, and stops it after 30 seconds. Leave the flag in.

**Use a read-only role as well.** Upstream says itself that restricted mode can be bypassed if the database has unsafe procedural languages enabled. The flag is the server's promise; the role is the database's. Connect as a role that can only read — on PostgreSQL 14 or later, a login role granted `pg_read_all_data` and nothing else — so a bypass meets a refusal from PostgreSQL too. The statistics views the health checks read also need `pg_monitor` for full results. Never connect as the database owner or a superuser.

**The data leaves with the answer.** Everything a query returns goes into the conversation, and to the model provider if the model is not local. Point it at a development copy or a replica with personal data masked, not at production, unless reading production data is the point and allowed.

**The package needs a constraint to start.** `0.3.0` depends on `mcp>=1.5.0` with no upper bound, and MCP Python SDK 2.0, released 2026-07-28, removed a module it imports. Unconstrained, `uvx postgres-mcp==0.3.0` now resolves SDK 2.x and fails at startup. Upstream fixed this on its main branch on 2026-08-16 but has not released it; the commands above add `--with "mcp<2"` so `uvx` resolves a 1.x SDK. Drop it when a release carries the fix.

**The last release is from 2025-05-16.** The repository is not archived and has commits through August 2026, including streamable HTTP support, but none of that is in `0.3.0`. Check for a newer release before installing, and move the pin when there is one.

**One tool calls OpenAI, and only if you let it.** The experimental "index tuning by LLM" method sends the schema and query plans to OpenAI and needs `OPENAI_API_KEY`. The commands above do not set it, so that method is unavailable and the default, deterministic index advisor is used.

There is no telemetry.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
