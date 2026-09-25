# Changelog

## 1.0.0 — 2026-09-25

First recipe for Shopify Dev MCP, pinned at `1.15.4`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`@shopify/dev-mcp` `dist-tags.latest`, published
  2026-09-18), rather than recalled.
- The server's source is not public. Its tools, network calls and telemetry
  were read from the published `1.15.4` package and its README.
- Instrumentation, which by default sends every tool call's inputs and result
  to shopify.dev, is turned off with `OPT_OUT_INSTRUMENTATION=true` in every
  command. The README names the opt-out file upstream recommends, and what
  still leaves the machine.
- No credentials: the server reaches documentation and schemas, not a store.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
