# Changelog

## 1.0.0 — 2026-09-24

First recipe for Fetch MCP, pinned at `2026.8.18`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`mcp-server-fetch` `info.version`), and matches the
  upstream repository's `2026.8.18` release, rather than recalled.
- The README carries the upstream's own warning that the server reaches local
  and internal addresses, says what that means on a machine with private
  services, and names `--proxy-url` as the way to put a filter in front of it.
- It also says upstream calls its reference servers educational examples, not
  production-ready.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
