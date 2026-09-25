# Changelog

## 1.0.0 — 2026-09-24

First recipe for the Azure DevOps MCP Server, pinned at `2.10.0`.

- Drafted from the 2026-09-24 catalog research and verified live on
  2026-09-24: the upstream repository (not archived), the release `v2.10.0`
  (not a prerelease), and `@azure-devops/mcp@2.10.0` as the registry's
  current non-nightly version. The version was read, not recalled.
- The local npm server is pinned rather than the remote one at
  `mcp.dev.azure.com`, which has no version to hold, cannot be reached from
  Codex, and needs a custom Entra app registration for Claude Code.
- Every install command narrows the server with `-d core work-items`, from the
  domain list the upstream documents, so an agent does not start with
  repositories, pipelines and wikis it was never meant to touch.
- Claude Code and Codex commands follow the upstream's getting-started guide;
  the Gemini CLI command follows the shape verified in `schema/agents.yaml`
  and Gemini CLI's own documentation for passing dashed arguments. No command
  is listed for an agent whose syntax nobody has confirmed.
