# Changelog

## 1.0.0 — 2026-09-24

First recipe for GitLab's built-in MCP server, which needs GitLab 18.6 or
later and is in beta.

- Drafted from the 2026-09-24 catalog research and verified live on
  2026-09-24 against GitLab's MCP server documentation and its tool list, and
  against `https://gitlab.com/api/v4/mcp`, which answers `401` with an OAuth
  challenge for the `mcp` scope.
- `upstream_version` is `gitlab-18.6`: the server ships inside GitLab and has
  no release of its own, and 18.6 is the version in which GitLab moved it
  from experiment to beta.
- GitLab's own server only; community servers for GitLab are not listed
  (one integration per upstream, the vendor's first).
- Claude Code and Codex commands follow GitLab's documentation, with the URL
  quoted so the placeholder is not read by the shell; the Gemini CLI command
  follows the shape verified in `schema/agents.yaml` for the `httpUrl` setting
  GitLab documents. No command is listed for an agent whose syntax nobody has
  confirmed.
