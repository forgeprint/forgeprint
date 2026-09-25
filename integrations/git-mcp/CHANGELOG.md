# Changelog

## 1.0.0 — 2026-09-24

First recipe for Git MCP, pinned at `2026.8.18`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`mcp-server-git` `info.version`), and matches the
  upstream repository's `2026.8.18` release, rather than recalled.
- The four advisories against earlier versions (CVE-2025-68143,
  CVE-2025-68144, CVE-2025-68145, CVE-2026-27735) were read in the GitHub
  Advisory Database on 2026-09-24, with the version that fixed each. The pin is
  later than all of them.
- Every command passes `--repository`, and the README says what the server
  checks without it: nothing.
- The permissions say it writes — stages, commits, unstages, creates and
  switches branches — and that it has no push.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
