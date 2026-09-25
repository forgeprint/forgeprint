# Changelog

## 1.0.0 — 2026-09-25

First recipe for Svelte MCP, pinned at `0.1.26`.

- Drafted from the 2026-09-24 integrations research, which had not fetched a
  version. The pin was read live on 2026-09-25 from npm (`@sveltejs/mcp`
  `dist-tags.latest`), and matches the upstream's `@sveltejs/mcp@0.1.26`
  release (2026-08-07), rather than recalled.
- The package, not the hosted `https://mcp.svelte.dev/mcp`: a package can be
  pinned and keeps the checked code on the machine. The README names the
  hosted server and says what changes with it.
- The tool list and network calls were read from the published `0.1.26`
  bundle: documentation from svelte.dev, local static analysis, no telemetry.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
