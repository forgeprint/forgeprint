# Changelog

## 1.0.0 — 2026-09-24

First recipe for dbt MCP Server, pinned at `2.4.0`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`dbt-mcp` `info.version`), and matches the upstream's
  latest release, `v2.4.0` (2026-09-22), rather than recalled.
- Scoped to the minimum: local only, no dbt platform credentials, and
  `DBT_MCP_ENABLE_TOOLS` allowing five tools that parse, list, compile and
  read the manifest. Nothing that builds, runs or tests models is enabled.
- The README says which toolsets need dbt platform credentials and which work
  locally, from the upstream's settings source and setup documentation.
- Usage tracking, on by default and reporting every tool call, is turned off
  with `DO_NOT_TRACK=true` in every command.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
