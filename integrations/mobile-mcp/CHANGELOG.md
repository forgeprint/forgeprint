# Changelog

## 1.0.0 — 2026-09-25

First recipe for Mobile MCP, pinned at `1.0.5`.

- Drafted from the 2026-09-24 integrations research. The pin was read live on
  2026-09-25 from npm (`@mobilenext/mobile-mcp` `dist-tags.latest`, published
  2026-09-23; the `beta` tag is older and not used) and matches the upstream's
  `1.0.5` tag, rather than recalled.
- **Telemetry off in every command** (`MOBILEMCP_DISABLE_TELEMETRY=1`). Read
  from the published package: by default it sends a PostHog event at launch
  and for every tool call, and a Scarf pixel once per process. The variable
  stops both.
- The platform requirements are stated plainly: iOS needs macOS with Xcode,
  Android needs the Android SDK, and real devices need USB access.
- The README names every tool that changes a device, and the cloud-device
  tools that can reserve a billed remote device.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
