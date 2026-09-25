# Changelog

## 1.0.0 — 2026-09-24

First recipe for Postgres MCP Pro, pinned at `0.3.0`.

- Drafted from the 2026-09-24 integrations research, which chose this
  maintained community server over the archived reference
  `@modelcontextprotocol/server-postgres`. The pin was read live on 2026-09-24
  from PyPI (`postgres-mcp` `info.version`), and matches the upstream's latest
  release, `v0.3.0` (2025-05-16), rather than recalled.
- Every command passes `--access-mode=restricted`. The server's default,
  read from its source at that tag, is `unrestricted`.
- Every command adds `--with "mcp<2"`: `0.3.0` leaves the MCP SDK unbounded,
  SDK 2.0 removed a module it imports, and the upstream fix is not released.
- The README says to connect as a read-only role as well, and names the
  experimental index method that sends schema and plans to OpenAI.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
