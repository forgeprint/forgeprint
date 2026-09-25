# Changelog

## 1.0.0 — 2026-09-24

First recipe for the Supabase MCP Server, against the hosted endpoint
`https://mcp.supabase.com/mcp`.

- Drafted from the 2026-09-24 catalog research and verified live on
  2026-09-24: the upstream repository (not archived), the hosted endpoint
  (answers `401` with an OAuth resource-metadata challenge), and the install
  command for each agent, read from Supabase's own MCP guide.
- `upstream_version` is `hosted`: the endpoint reports no version before
  sign-in and Supabase can change it at any time. The npm package
  (`@supabase/mcp-server-supabase`, `0.13.0` on that date) is not used,
  because Supabase's current guide documents only the hosted endpoint.
- Every install command carries `read_only=true` and `project_ref`, so the
  server starts scoped to one project and runs SQL as a read-only Postgres
  user.
- Install commands for the agents Supabase documents: Claude Code, Codex and
  Gemini CLI. No command is listed for an agent whose syntax nobody has
  confirmed.
