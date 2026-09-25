# Changelog

## 1.0.0 — 2026-09-25

First recipe for Nx MCP, pinned at `0.25.0`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`nx-mcp` `dist-tags.latest`, published 2026-04-30),
  rather than recalled; the tool list, flags and telemetry were read from that
  version's published README and bundle.
- Pinned in place of upstream's `nx mcp`, which runs `nx-mcp@latest`.
- Every command passes `--no-minimal`, so the workspace tools are available
  without the agent skills upstream pairs them with.
- Scoped to what works locally: `NX_NO_CLOUD=true` keeps the Nx Cloud tools
  off, including the one that applies self-healing fixes in Nx Cloud.
- Usage statistics, sent to Google Analytics for every tool call by default,
  are turned off with `--disableTelemetry` in every command.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
