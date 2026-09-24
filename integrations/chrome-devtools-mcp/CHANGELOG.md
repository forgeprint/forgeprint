# Changelog

## 1.1.0 — 2026-09-24

Update: pinned at `1.10.1`, and two things the first recipe got wrong.

- `1.10.0` adds a `get_css_style` tool and a config file; `1.10.1` fixes the
  bundle. Read from the upstream release notes on 2026-09-24.
- **Usage statistics are now off in every command** (`--no-usage-statistics`).
  Google collects them by default, and the first recipe did not say so.
- **The permissions said "reads".** The server also navigates and runs
  JavaScript in pages. The summary says so now, and the README names
  `--no-javascript-evaluation` for a read-only session.

## 1.0.0 — 2026-09-23

First recipe for Chrome DevTools MCP, pinned at `1.9.0`.

- Upstream verified at https://github.com/ChromeDevTools/chrome-devtools-mcp on 2026-09-23; the version was read
  from the registry rather than recalled.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
- Permissions stated in one sentence, and what to watch for stated in the
  README rather than left to the reader to work out.
