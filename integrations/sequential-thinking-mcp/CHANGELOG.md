# Changelog

## 1.0.0 — 2026-09-24

First recipe for Sequential Thinking MCP, pinned at `2026.8.31`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from npm (`@modelcontextprotocol/server-sequential-thinking`
  `dist-tags.latest`, not deprecated), and matches the upstream repository's
  `2026.8.31` release, rather than recalled.
- The README says what the tool is — a scratchpad that stores steps and
  returns counters — and that whether it helps depends on the model, read from
  the server's source at that tag.
- Every command sets `DISABLE_THOUGHT_LOGGING=true`, so full thoughts are not
  written to the host's MCP logs.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
