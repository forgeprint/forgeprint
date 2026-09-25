# Changelog

## 1.0.0 — 2026-09-25

First recipe for the LaunchDarkly MCP Server, pinned at `0.6.2`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`@launchdarkly/mcp-server` `dist-tags.latest`,
  published 2026-05-08) and matches the upstream's latest release, `v0.6.2`,
  rather than recalled.
- **Read-only by default.** Every command passes `--scope read`, which mounts
  only the tools the package tags as reads. The README says what removing it
  turns on: creating, updating, toggling and deleting flags and AI Configs.
- **The key goes on the command line.** Read from the published `0.6.2`
  source: the server takes the access token only from `--api-key`; the
  `LAUNCHDARKLY_API_KEY` variable its SDK knows is never reached through
  `mcp start`. Every command therefore passes the variable's name in the
  arguments (D29), and the README says where each agent stores it. Codex is
  not listed: it can only store the expanded key, in plain text (D32).
- LaunchDarkly also runs a hosted server at
  `https://mcp.launchdarkly.com/mcp/launchdarkly` and recommends it outside the
  EU and Federal instances. A hosted endpoint cannot be pinned, so the recipe
  takes the package (D25) and names the hosted one in the README.
- No telemetry was found in the package.
