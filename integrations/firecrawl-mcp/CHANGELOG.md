# Changelog

## 1.0.0 — 2026-09-25

First recipe for Firecrawl MCP, pinned at `3.25.4`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`firecrawl-mcp` `dist-tags.latest`, published
  2026-09-23; the `beta` tag is older and not used), rather than recalled.
- The tool list and environment variables were read from the published
  `3.25.4` bundle and README. The README names every tool that acts rather
  than reads — browser interaction, recurring monitors with webhooks, the
  research agent, paid catalogue providers — and how to deny them in the
  agent, since the server has no switch of its own.
- It says what leaves the machine (every URL, query and prompt, to Firecrawl)
  and what it costs, from the pricing page read the same day.
- The secret is referenced as `${FIRECRAWL_API_KEY}` in every command, never
  as a value.
- Gemini CLI's value is in single quotes, so Gemini CLI stores the
  `${FIRECRAWL_API_KEY}` reference and expands it when the server starts,
  instead of the shell writing the key to `settings.json` in plain text. The
  README says that `codex mcp add --env` writes the key in plain text to
  `~/.codex/config.toml`, and names the `env_vars` setting that keeps only
  its name.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
