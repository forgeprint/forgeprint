# Changelog

## 1.0.0 — 2026-09-25

First recipe for Brave Search MCP, pinned at `2.1.4`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`@brave/brave-search-mcp-server` `dist-tags.latest`),
  and matches the upstream's latest release, `v2.1.4` (2026-09-17), rather
  than recalled.
- Brave's own server, not the archived `@modelcontextprotocol/server-brave-search`
  (plan decision D15); the README says not to install that one.
- The tool list, environment variables and the one endpoint it calls were read
  from the upstream source at `v2.1.4`. It only searches, and has no telemetry.
- The secret is referenced as `${BRAVE_API_KEY}` in every command, never as a
  value.
- Gemini CLI's value is in single quotes, so Gemini CLI stores the
  `${BRAVE_API_KEY}` reference and expands it when the server starts,
  instead of the shell writing the key to `settings.json` in plain text. The
  README says that `codex mcp add --env` writes the key in plain text to
  `~/.codex/config.toml`, and names the `env_vars` setting that keeps only
  its name.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
