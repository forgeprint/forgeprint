# Changelog

## 1.0.0 — 2026-09-24

First recipe for AWS Documentation MCP Server, pinned at `1.2.1`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-24 from PyPI (`awslabs.aws-documentation-mcp-server`
  `info.version`, uploaded 2026-09-08), and matches `pyproject.toml` at the
  upstream's `2026.09.20260908143235` release, rather than recalled.
- `upstream` is the server's folder in the `awslabs/mcp` monorepo, so that one
  integration per upstream means one per server; the README says why, and
  that the credentialed API server in the same repository is not this recipe.
- The README says what the server sends to AWS — a per-process session ID
  and a model-written search intent — read from its source at that release,
  and that no flag turns it off.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
