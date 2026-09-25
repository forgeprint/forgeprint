# Changelog

## 1.0.0 — 2026-09-24

First recipe for ClickHouse MCP Server, pinned at `0.7.0`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`mcp-clickhouse` `info.version`), and matches the
  upstream's latest release, `v0.7.0` (2026-09-21), rather than recalled.
- The research left open whether the server is read-only by default. The
  upstream README at `v0.7.0` answers it: yes, `CLICKHOUSE_ALLOW_WRITE_ACCESS`
  defaults to `false` and queries are sent with `readonly=1`. Every command
  sets it to `false` explicitly anyway.
- The README says the user's grants are the boundary, and that the
  destructive-statement check is, in upstream's words, not a security boundary.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
