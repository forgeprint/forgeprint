# MongoDB MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server),
> pinned at `3.0.4` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Lets the agent look at the data instead of guessing at it: find and aggregate over collections, infer a collection's schema from its documents, list indexes, and explain a query plan. Useful for writing queries and migrations against the shape the data actually has.

It needs Node.js 22.13 or later; upstream has deprecated Node 20.

## What it can reach

Reads every database and collection the connection string's user can read: documents, schemas, indexes, statistics and query plans; create, update and delete tools are not registered.

## Secrets it needs

- `MDB_MCP_CONNECTION_STRING` — a MongoDB connection string, `mongodb://` or `mongodb+srv://`, for a local deployment or an Atlas cluster. It contains a password, so it is a secret: put it in your environment, and **the agent never enters it for you.**

The upstream also accepts Atlas service account credentials, `MDB_MCP_API_CLIENT_ID` and `MDB_MCP_API_CLIENT_SECRET`, which add the Atlas tools (organisations, projects, clusters). This recipe does not set them; read the note below before you add them.

## Install

**claude-code**

```bash
claude mcp add-json mongodb '{"command":"npx","args":["-y","mongodb-mcp-server@3.0.4","--readOnly","--telemetry","disabled"],"env":{"MDB_MCP_CONNECTION_STRING":"${MDB_MCP_CONNECTION_STRING}"}}'
```

**codex**

```bash
codex mcp add mongodb --env "MDB_MCP_CONNECTION_STRING=$MDB_MCP_CONNECTION_STRING" -- npx -y mongodb-mcp-server@3.0.4 --readOnly --telemetry disabled
```

**gemini-cli**

```bash
gemini mcp add mongodb -e 'MDB_MCP_CONNECTION_STRING=$MDB_MCP_CONNECTION_STRING' npx -y mongodb-mcp-server@3.0.4 --readOnly --telemetry disabled
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Where the connection string ends up differs by agent. Claude Code stores `${MDB_MCP_CONNECTION_STRING}` and expands it when the server starts. Gemini CLI does the same, which is why its `-e` value is in single quotes; unquoted, the shell would expand it and Gemini would cut the value at its second `=`, which most Atlas connection strings have. Codex CLI stores what the shell expanded, so the password is written into `~/.codex/config.toml` in plain text; if you would rather it were not, list the variable under the server's `env_vars` in that file instead of passing `--env`.

## Before you install it

**`--readOnly` is in every command, and the upstream's examples are not pinned.** The vendor documentation installs `mongodb-mcp-server@latest`; this recipe pins `3.0.4`. Read-only mode registers only tools whose operation type is read, connect or metadata, so inserts, updates, deletes, index changes and drops are not offered at all.

**Give the connection string a read-only user as well.** The flag stops the server offering writes; a database user with the built-in `read` role, on the databases the work touches, makes MongoDB refuse them too. Everything the agent reads leaves your organisation if the model is not local, and a production database is personal data more often than not. Point it at a development copy where you can.

**Telemetry is off.** The server sends usage data to MongoDB by default. The commands pass `--telemetry disabled`.

**Atlas credentials change what "read-only" means.** With `MDB_MCP_API_CLIENT_ID` and `MDB_MCP_API_CLIENT_SECRET`, connecting to an Atlas cluster creates a temporary database user in the project (with `readAnyDatabase` under `--readOnly`, deleted after four hours by default). The service account needs a role that can create database users for that to work. If you only need to see projects and clusters, give it Project Read Only and expect the connect step to fail; if the database is what you need, a connection string is the narrower route.

**Two version lines.** npm's `latest` is `3.0.4`, and the repository's default branch is on the 3.x line. GitHub labels `v2.1.2` as its latest release only because it was published last, as a maintenance patch under npm's `v2` tag. This recipe pins the current line.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
