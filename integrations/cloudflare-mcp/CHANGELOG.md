# Changelog

## 1.0.0 — 2026-09-25

First recipe for the Cloudflare MCP Server, Cloudflare's hosted Code Mode
server at `https://mcp.cloudflare.com/mcp`.

- Drafted from the 2026-09-24 integrations research and verified live on
  2026-09-25 against https://github.com/cloudflare/mcp,
  https://github.com/cloudflare/mcp-server-cloudflare and Cloudflare's
  "MCP servers for Cloudflare" page, rather than recalled.
- **Which server.** Cloudflare publishes one general server and about fifteen
  product-specific ones. This recipe is for the general one, which Cloudflare
  itself recommends first and which covers what the others do across the
  whole API. One integration per upstream (rule 9): the product servers live
  in a different repository and are named in the README as separate servers,
  not installed by this recipe.
- The server is hosted and has no release, so `upstream_version` is `hosted`
  (D25).
- OAuth is the default and no command carries a secret. The API-token
  alternative is in the README, passed by variable name only (D29): `${NAME}`
  for Claude Code, a single-quoted header for Gemini CLI, and
  `--bearer-token-env-var` for Codex.
- The permissions summary says it writes and deletes, and the README says the
  permissions granted at sign-in are the only scope there is.
