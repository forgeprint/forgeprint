# Changelog

## 1.0.0 — 2026-09-25

First recipe for agent-device, pinned at `0.21.14`.

- Drafted from the 2026-09-24 integrations research, which pinned `0.21.13`.
  The pin was read live on 2026-09-25 from npm (`agent-device`
  `dist-tags.latest`, published 2026-09-24) and matches the upstream's
  `v0.21.14` tag, rather than recalled.
- The command is the pinned `npx` form the upstream documents for unattended
  agent use, with `mcp` as its argument.
- The tool list was read from the server itself: `tools/list` on the pinned
  package returned 59 tools, none carrying read-only or destructive
  annotations. The README names the ones that change a device.
- No usage telemetry was found in the package. It checks npm for a newer
  version when run in a terminal; every command sets
  `AGENT_DEVICE_NO_UPDATE_NOTIFIER=1`, which turns that off.
- The platform requirements are stated plainly: Node.js 22.12 or later, macOS
  with Xcode for iOS, the Android SDK for Android.
