# Changelog

## 1.0.0 — 2026-09-25

First recipe for Perplexity MCP, pinned at `1.2.1`.

- Drafted from the 2026-09-24 integrations research, which had not fetched a
  version. The pin was read live on 2026-09-25 from npm
  (`@perplexity-ai/mcp-server` `dist-tags.latest`, published 2026-08-27),
  rather than recalled. The upstream publishes no GitHub releases, so npm is
  the release record.
- The package, not the hosted `https://api.perplexity.ai/mcp`, which cannot be
  pinned; the README names it.
- The tool list, environment and the one endpoint it calls were read from the
  published `1.2.1` build. The README says that every question is sent to
  Perplexity and billed, and what `perplexity_research` costs in one call.
- The secret is referenced as `${PERPLEXITY_API_KEY}` in every command, never
  as a value, where upstream's own commands type the key in.
- Gemini CLI's value is in single quotes, so Gemini CLI stores the
  `${PERPLEXITY_API_KEY}` reference and expands it when the server starts,
  instead of the shell writing the key to `settings.json` in plain text. The
  README says that `codex mcp add --env` writes the key in plain text to
  `~/.codex/config.toml`, and names the `env_vars` setting that keeps only
  its name.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
