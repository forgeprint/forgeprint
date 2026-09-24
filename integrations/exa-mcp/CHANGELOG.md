# Changelog

## 1.1.0 — 2026-09-25

Fix: the Claude Code and Gemini CLI commands now keep the secret as a `${VAR}`
reference, which each agent expands itself.

- **The secret never arrived.** Claude Code expands environment variables in
  an MCP server's `env`, `url` and `headers` only in the `${VAR}` form. The
  command wrapped the JSON in single quotes, so the shell left `$VAR` alone
  and Claude Code stored and sent the literal text instead of the value.
- **Gemini CLI keeps the reference, not the key.** Its command now quotes the
  value in single quotes, so Gemini CLI stores `${VAR}` in its settings and
  expands it when the server starts. Before, the shell expanded it and the key
  was written to `settings.json` in plain text.
- The README says that `codex mcp add --env` writes the key in plain text,
  and names the `env_vars` setting that keeps only its name.

## 1.0.0 — 2026-09-23

First recipe for Exa Search MCP, pinned at `3.4.1`.

- Upstream verified at https://github.com/exa-labs/exa-mcp-server on 2026-09-23; the version was read
  from the registry rather than recalled.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
- Permissions stated in one sentence, and what to watch for stated in the
  README rather than left to the reader to work out.
