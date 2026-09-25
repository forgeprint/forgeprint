# Changelog

## 1.0.0 — 2026-09-24

First recipe for Time MCP, pinned at `2026.8.18`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`mcp-server-time` `info.version`), and matches the
  upstream repository's `2026.8.18` release, rather than recalled.
- No secrets and no network access, read from the server's source at that tag.
  The README names `--local-timezone` for machines whose own zone is not the
  user's.
- It also says upstream calls its reference servers educational examples, not
  production-ready.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
