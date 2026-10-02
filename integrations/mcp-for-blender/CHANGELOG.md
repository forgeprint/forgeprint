# Changelog

## 1.0.0 — 2026-09-30

First recipe for MCP for Blender, pinned at `2.1.1`.

- Drafted from the 2026-09-24 integrations research, which held this server
  back (D17) until somebody read its tool list. The list was read on
  2026-09-30 from the published `mcp-for-blender` 2.1.1 source: 37 tools, and
  `execute_blender_code` does run arbitrary Python inside Blender, which was
  the open question. The hold is answered rather than inherited.
- **The name moved.** The package was `blender-mcp`; 2.x is published as
  `mcp-for-blender`, and the old name is now a wrapper that depends on it and
  prints a notice. The recipe uses the current name, and the slug follows the
  upstream (D31).
- **Safe mode on.** `BLENDER_MCP_SAFE_MODE=1` turns on the upstream's opt-in
  allowlist for scripts sent through `execute_blender_code`. It is off by
  default. The README says plainly that an allowlist parser is not a sandbox.
- **Telemetry off.** It is on by default and posts to a hosted database. Read
  from the source: without consent it sends an install identifier, tool name,
  outcome, duration and a sanitised error; with the consent the addon asks
  for, it also sends prompt text, code snippets, parameters, scene information
  and screenshots. `DISABLE_TELEMETRY=1` stops all of it, and the README says
  what was being sent.
- The version and licence were read live on 2026-09-30 from PyPI
  (`mcp-for-blender` 2.1.1, published 2026-09-27) and the repository, which is
  MIT and active.
- No secret is declared: the asset services' API keys are entered in the
  Blender addon's panel, not passed to this server.
