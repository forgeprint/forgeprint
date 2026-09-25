# Changelog

## 1.0.0 — 2026-09-25

First recipe for Tavily MCP, pinned at `0.2.22`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`tavily-mcp` `dist-tags.latest`, published
  2026-08-05), rather than recalled. The upstream publishes no GitHub
  releases, so npm is the release record.
- The package, not the hosted `https://mcp.tavily.com/mcp`, which cannot be
  pinned; the README names it and says to use OAuth there rather than a key in
  the URL.
- The tool list, endpoints and environment were read from the published
  `0.2.22` build: five tools, all calls to `api.tavily.com`, a `.env` file
  loaded from the working directory, and a keyless mode when no key is set.
- The secret is referenced as `${TAVILY_API_KEY}` in every command, never as a
  value.
- Gemini CLI's value is in single quotes, so Gemini CLI stores the
  `${TAVILY_API_KEY}` reference and expands it when the server starts,
  instead of the shell writing the key to `settings.json` in plain text. The
  README says that `codex mcp add --env` writes the key in plain text to
  `~/.codex/config.toml`, and names the `env_vars` setting that keeps only
  its name.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
