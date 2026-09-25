# Changelog

## 1.0.0 — 2026-09-24

First recipe for Linear MCP, recorded as `hosted`.

- Drafted from the 2026-09-24 research and verified live on 2026-09-24 against
  https://linear.app/docs/mcp. The endpoints, the authentication methods and
  the Claude Code and Codex commands were read from that page rather than
  recalled, and both endpoints answered with an OAuth challenge.
- Linear publishes no source repository for the server, so `upstream` is its
  documentation page and `upstream_version` is `hosted`. The README says
  plainly that Linear can change it at any time.
- The read-only endpoint, `/mcp/readonly`, is the default in every command. The
  full `/mcp` endpoint is documented as the opt-in for writes.
- OAuth 2.1 is the default, so no secret is declared. The Bearer header
  alternative is documented with no value in any command.
