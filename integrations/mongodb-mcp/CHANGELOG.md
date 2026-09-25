# Changelog

## 1.0.0 — 2026-09-24

First recipe for MongoDB MCP Server, pinned at `3.0.4`.

- Drafted from the 2026-09-24 integrations research
  (`docs/research/2026-09-24-integrations.md`). The version was read live on
  2026-09-24 from npm (`dist-tags.latest` is `3.0.4`), and matches the
  `v3.0.4` GitHub release (not a pre-release) and the version on the default
  branch.
- The research left open which version line to pin, because GitHub's latest
  release was `v2.1.2`. That release was published last, as a patch under
  npm's `v2` dist-tag; 3.x is the current line.
- Every command passes `--readOnly` and `--telemetry disabled`. The vendor
  examples install `@latest`; this recipe pins.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
