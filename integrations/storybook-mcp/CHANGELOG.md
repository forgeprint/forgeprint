# Changelog

## 1.0.0 — 2026-09-24

First recipe for Storybook MCP, the `@storybook/addon-mcp` addon, pinned at
`10.6.0`.

- Drafted from the 2026-09-24 catalog research and verified live on
  2026-09-24: `10.6.0` is the registry's `latest` and the first non-beta
  release in the 10.6 line, published from the `storybookjs/storybook`
  monorepo (`code/addons/mcp`). The earlier standalone repository,
  `storybookjs/mcp`, is archived and is not the upstream.
- Each install command adds the addon to the project with
  `npx storybook add`, then registers `http://localhost:6006/mcp` with the
  agent. Storybook documents only that URL and tells readers to follow their
  agent's own documentation, so the registration commands follow the shapes
  verified in `schema/agents.yaml` (Claude Code, Gemini CLI) and Codex's own
  `mcp add --url` argument. No command is listed for an agent whose syntax
  nobody has confirmed.
- No secrets: the server is the local Storybook dev server.
