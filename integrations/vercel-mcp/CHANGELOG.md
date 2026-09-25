# Changelog

## 1.0.0 — 2026-09-25

First recipe for Vercel MCP, Vercel's hosted server at `https://mcp.vercel.com`.

- Drafted from the 2026-09-24 integrations research and verified live on
  2026-09-25 against Vercel's MCP page and its tools reference. The endpoint,
  the client list and the Claude Code and Codex commands were read from those
  pages rather than recalled.
- The server is hosted and has no public source repository and no version, so
  `upstream_version` is `hosted` (D25) and the upstream is Vercel's own
  documentation page. Vercel still labels it a public beta; the summary and
  the README say so.
- OAuth only, so no secret is declared and no command carries one.
- Gemini CLI uses the bridge Vercel documents for it, `mcp-remote`, pinned at
  `0.14.3` (npm, published 2026-09-21) instead of the unpinned command on
  Vercel's page.
- The permissions summary says what the server changes: deployments to
  production, shareable links past deployment protection, toolbar comments,
  and non-refundable purchases.
