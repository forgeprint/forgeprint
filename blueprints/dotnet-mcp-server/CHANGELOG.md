# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-22

First release.

- .NET 10 with the SDK pinned through `global.json` at the feature band base
  (`10.0.100`, `latestFeature`).
- Official `ModelContextProtocol` SDK 2.2.0, or `ModelContextProtocol.AspNetCore`
  2.2.0 for the HTTP transport.
- `transport` option: `stdio` (console host, `WithStdioServerTransport`) or
  `http` (web host, `WithHttpTransport` and `MapMcp`).
- Attribute-based tool discovery with one example tool, and tests covering both
  its behaviour and its protocol exposure, because a missing attribute removes a
  tool without breaking the build.
- Logging directed to stderr on the stdio transport, where stdout carries the
  JSON-RPC stream.
- `scripts/probe.mjs`: a dependency-free MCP client that performs
  `initialize`, `tools/list` and `tools/call` against the built server.
- CI workflow with `actions/checkout` and `actions/setup-dotnet` pinned to
  commit SHAs and read-only workflow permissions.

Verified on Windows with .NET SDK 10.0.103. Both transports build with zero
warnings and pass both tests. The stdio server answered a real JSON-RPC session
(`initialize` → protocol 2025-06-18, `tools/list` → `echo`, `tools/call` →
`echo: hello forgeprint`). The HTTP server answered an `initialize` POST with
the expected SSE response.

The `agents` field lists `claude-code` only. Verification was done at the
protocol level with the probe script rather than by connecting each client, so
other agents are left off until somebody has actually run them.

### Planned

- Resource and prompt registration alongside tools.
- An authentication example for the HTTP transport, once there is a
  recommendation worth pinning rather than a placeholder.
