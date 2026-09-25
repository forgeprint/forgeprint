# Changelog

## 1.0.0 — 2026-09-25

First recipe for Serena, pinned at `1.7.0`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from PyPI (`serena-agent` `info.version`), and matches the
  upstream's latest release, `v1.7.0` (2026-08-09), rather than recalled.
- Every command runs Serena in the agent's own context (`claude-code`,
  `codex`, or `ide` for Gemini CLI), which leaves out its shell command and
  file creation tools. The README names every tool that still writes, and how
  to exclude them for a read-only session.
- Usage reporting, on by default and sent at every start, is turned off with
  `SERENA_USAGE_REPORTING=false`, and the dashboard no longer opens a browser
  tab at every start (`--open-web-dashboard false`).
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
