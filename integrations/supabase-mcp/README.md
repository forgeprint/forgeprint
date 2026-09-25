# Supabase MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a service somebody else publishes and runs.
> The upstream is [supabase/mcp](https://github.com/supabase/mcp), and the
> server itself is hosted by Supabase at `https://mcp.supabase.com/mcp`.
> **It cannot be pinned:** the endpoint has no version this recipe can hold,
> and Supabase can change what it does at any time. It was verified on
> 2026-09-24.
> **Review the permissions below before installing.**

## What it does

The agent can see the database it is writing code against: tables, columns,
migrations, logs, advisors, and Supabase's own documentation, without anybody
pasting a schema into the chat. Useful when generating a query, a migration or
a row-level-security policy against the real shape of the data.

## What it can reach

Signs in as you through OAuth and, as installed here, reads one project
read-only; without `read_only` it can run SQL that changes data, apply
migrations and deploy functions.

## Secrets it needs

None in your environment. The first time the server is used, your agent opens
a browser and you sign in to Supabase yourself (OAuth with dynamic client
registration). Where a browser is not available, such as CI, Supabase
documents a personal access token instead; create it in your Supabase account
and keep it out of the repository. **The agent never enters it for you.**

## Install

Every command below ends in two query parameters, and both are the point of
this recipe:

- `read_only=true` — every query runs as a read-only Postgres user, and the
  tools that change things are left out.
- `project_ref=<your-project-ref>` — the server sees one project and loses the
  account-level tools. **`<your-project-ref>` is a placeholder:** replace it
  with your project's ID, shown as _Project ID_ in the project's settings.

**claude-code**

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?read_only=true&project_ref=<your-project-ref>"
```

Then run `/mcp` inside Claude Code, choose `supabase` and authenticate.

**codex**

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?read_only=true&project_ref=<your-project-ref>"
```

Then run `codex mcp login supabase`.

**gemini-cli**

```bash
gemini mcp add -t http supabase "https://mcp.supabase.com/mcp?read_only=true&project_ref=<your-project-ref>"
```

Then run `/mcp auth supabase` inside Gemini CLI. Supabase's guide asks for
Gemini CLI 0.20.2 or later.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

Without `read_only=true`, `execute_sql` runs whatever the agent writes with
your developer permissions, and `apply_migration`, `deploy_edge_function` and
`create_project` are available too. Without `project_ref`, it reaches every
project and organisation your account can. Keep both parameters.

Supabase names prompt injection as the main risk: a row in your own data can
contain text aimed at the agent. Treat what comes back as data, never as
instructions, keep tool-call approval on, and point it at a development
project rather than production. The `features` parameter narrows it further
to the tool groups you need, for example `features=database,docs`.

## Updating

There is no version to move. When Supabase changes the endpoint or its query
parameters, re-read their MCP guide, and change `verified_on` and the install
commands together in one pull request. If Supabase documents a pinnable
package install again, prefer it and pin it in `upstream_version`.
