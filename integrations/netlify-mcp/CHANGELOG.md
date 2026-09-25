# Changelog

## 1.0.0 — 2026-09-25

First recipe for the Netlify MCP Server, pinned at `1.15.1`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`@netlify/mcp` `dist-tags.latest`, published
  2025-11-11), rather than recalled. The repository's `main` already says `1.16.0`, which is not
  published; the recipe pins what npm serves.
- Netlify also runs the same server hosted at
  `https://netlify-mcp.netlify.app/mcp` and recommends it. A hosted endpoint
  cannot be pinned, so the recipe takes the package (D25) and names the hosted
  one in the README.
- Behaviour read from the published `1.15.1` package: where the token comes
  from (an optional environment variable, else the Netlify CLI's login, else
  it runs `netlify login` itself), which tools write, and what the deploy tool
  uploads. No telemetry was found in it.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`, pinned where Netlify's own commands are not. No
  command carries a secret.
