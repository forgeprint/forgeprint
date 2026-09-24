# Changelog

## 1.1.0 — 2026-09-25

Fix: the Claude Code command now writes `${VAR}`, which Claude Code expands.

- **The secret never arrived.** Claude Code expands environment variables in
  an MCP server's `env`, `url` and `headers` only in the `${VAR}` form. The
  command wrapped the JSON in single quotes, so the shell left `$VAR` alone
  and Claude Code stored and sent the literal text instead of the value.
- The other agents' commands are unchanged: there the shell expands the
  variable before the agent sees it.

## 1.0.0 — 2026-09-23

First recipe for Figma Context MCP, pinned at `0.13.2`.

- Upstream verified at https://github.com/GLips/Figma-Context-MCP on 2026-09-23; the version was read
  from the registry rather than recalled.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
- Permissions stated in one sentence, and what to watch for stated in the
  README rather than left to the reader to work out.
