# Changelog

## 1.0.0 — 2026-09-24

First recipe for Grafana MCP, pinned at `1.5.1`.

- Drafted from the 2026-09-24 integrations research
  (`docs/research/2026-09-24-integrations.md`). The version was read live on
  2026-09-24 from PyPI (`mcp-grafana` `info.version`) and matches the latest
  GitHub release, `v1.5.1`, rather than recalled.
- Every command passes `--disable-write`, and the README says to use a Viewer
  service account where the upstream suggests Editor, and why.
- `--usage-stats=disabled` is passed explicitly, because the upstream plans to
  turn reporting on by default in a later release.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
