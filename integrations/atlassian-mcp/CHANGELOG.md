# Changelog

## 1.0.0 — 2026-09-24

First recipe for the Atlassian Rovo MCP Server, recorded at endpoint version `v2`.

- Drafted from the 2026-09-24 research and verified live on 2026-09-24 against
  https://github.com/atlassian/atlassian-mcp-server and Atlassian's
  getting-started guide. The endpoint, the authentication methods and the
  Claude Code and Codex commands were read from those pages rather than
  recalled.
- The server is hosted, so `upstream_version` records the endpoint version in
  its URL (`v2`) rather than a release. The README says plainly that Atlassian
  can change it at any time.
- OAuth 2.1 is the default, so no secret is declared. API token authentication
  is documented as the admin-enabled alternative, with no value in any command.
- Permissions stated in one sentence, including that it writes. The permission
  groups, the disabled-by-default delete tools and what happens to the v1
  endpoint are stated in the README.
