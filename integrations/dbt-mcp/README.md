# dbt MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [dbt-labs/dbt-mcp](https://github.com/dbt-labs/dbt-mcp),
> pinned at `2.4.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

dbt Labs' own server. In full it has eight toolsets; this recipe turns on five tools from one of them, the smallest set that lets an agent understand a dbt project without changing a warehouse:

- `parse` — parse and validate the project files.
- `list` — list resources by type, with dbt's selector syntax.
- `compile` — render a model's Jinja into the SQL it would run.
- `get_lineage_dev` and `get_node_details_dev` — read lineage and node details from the local `manifest.json`.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed; the package needs Python 3.12 or 3.13, which `uv` fetches if the machine has neither. It also needs dbt itself installed. Replace `/path/to/dbt/project` with the folder holding `dbt_project.yml`, and `/path/to/dbt` with the full path of the `dbt` executable (`which dbt`, or `where dbt` on Windows).

### What works without a dbt platform account, and what does not

| Toolset                                 | Needs                                                                                      | In this recipe |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | -------------- |
| dbt CLI (`parse`, `list`, `compile`, …) | `DBT_PROJECT_DIR`, `DBT_PATH`                                                              | five tools     |
| Codegen                                 | the same, plus the `dbt-codegen` package; off by default                                   | no             |
| LSP and Fusion (column lineage)         | the same, plus the dbt VS Code extension; the `fusion.*` tools go through the dbt platform | no             |
| Product docs                            | network access to docs.getdbt.com                                                          | no             |
| SQL (`execute_sql`, `text_to_sql`)      | dbt platform: a personal access token, `DBT_DEV_ENV_ID`, `DBT_USER_ID`                     | no             |
| Semantic Layer, Discovery               | dbt platform: `DBT_HOST`, `DBT_TOKEN`, `DBT_PROD_ENV_ID`                                   | no             |
| Admin API (jobs, runs, artifacts)       | dbt platform: `DBT_HOST`, `DBT_TOKEN`, `DBT_ACCOUNT_ID`                                    | no             |

Upstream disables a toolset whose variables are missing, so without `DBT_HOST` none of the platform toolsets start. `DBT_MCP_ENABLE_TOOLS` narrows it further: when it is set, only the tools it names are registered.

## What it can reach

Runs the local dbt executable on one project to parse, list and compile it and read its manifest; compile may query the warehouse through the profile dbt uses, and no tool that builds, runs or tests models is enabled.

## Install

**claude-code**

```bash
claude mcp add-json dbt '{"command":"uvx","args":["dbt-mcp==2.4.0"],"env":{"DBT_PROJECT_DIR":"/path/to/dbt/project","DBT_PATH":"/path/to/dbt","DBT_MCP_ENABLE_TOOLS":"parse,list,compile,get_lineage_dev,get_node_details_dev","DO_NOT_TRACK":"true"}}'
```

**codex**

```bash
codex mcp add dbt --env "DBT_PROJECT_DIR=/path/to/dbt/project" --env "DBT_PATH=/path/to/dbt" --env "DBT_MCP_ENABLE_TOOLS=parse,list,compile,get_lineage_dev,get_node_details_dev" --env "DO_NOT_TRACK=true" -- uvx dbt-mcp==2.4.0
```

**gemini-cli**

```bash
gemini mcp add dbt -e 'DBT_PROJECT_DIR=/path/to/dbt/project' -e 'DBT_PATH=/path/to/dbt' -e 'DBT_MCP_ENABLE_TOOLS=parse,list,compile,get_lineage_dev,get_node_details_dev' -e 'DO_NOT_TRACK=true' uvx dbt-mcp==2.4.0
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**Usage tracking is on by default, and every command turns it off.** Unless `DO_NOT_TRACK` or `DBT_SEND_ANONYMOUS_USAGE_STATS=false` is set, or the project's `dbt_project.yml` says otherwise, the server reports every tool call to dbt Labs: the tool name, its arguments (some redacted), the dbt account and user IDs when there are any, and a local user ID it writes to disk. The commands set `DO_NOT_TRACK=true`.

**Warehouse credentials come from dbt, not from here.** No secret is passed to this server. `compile` and `list` run the real dbt executable, which reads your `profiles.yml`, and `compile` can run introspective queries against the warehouse through that profile. Point the profile's target at a development schema with a role that can read, not at production.

**The tools left out write, or run whatever SQL they are given.** `build`, `run`, `test`, `clone` and `docs` materialise models, run tests or query the warehouse broadly; `show` runs arbitrary SQL; upstream itself warns that dbt CLI tools "could modify your data models, sources, and warehouse objects". To add one, put its name in `DBT_MCP_ENABLE_TOOLS` knowing that, and never add the Admin API's `trigger_job_run`, `cancel_job_run` or `retry_job_run` to an agent that should only read.

**dbt runs your project's code.** Macros and hooks in the project and its packages run when dbt parses and compiles it. That is what dbt always does, but it now happens when the agent asks. Install this only on projects whose packages you trust.

**For the dbt platform features,** use the token with the fewest permissions your dbt platform account allows (upstream notes that `execute_sql` needs a personal access token specifically); set the variables the table above names for the toolset you need, add only the tools you need to `DBT_MCP_ENABLE_TOOLS`, and keep the token out of the command, as the other database recipes here do.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
