# Changelog

## 1.0.0 — 2026-09-24

First recipe for Next.js DevTools MCP, pinned at `0.4.0`.

- Drafted from the 2026-09-24 integrations research
  (`docs/research/2026-09-24-integrations.md`). The version was read live on
  2026-09-24 from npm (`dist-tags.latest` is `0.4.0`), and matches the latest
  GitHub release, `v0.4.0`, rather than recalled. The vendor instructions
  install `@latest`; this recipe pins.
- `NEXT_TELEMETRY_DISABLED=1` is set in every command, after reading the
  upstream telemetry source at `v0.4.0` to confirm the server checks it.
- The README says which tools hand the agent commands to run, and that
  0.4.0 removed the 0.3.x migration tools.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
