# Changelog

## 1.2.0 — 2026-09-23

Recommends `dotnet-senior-architect` and `security-reviewer`, and the
`github-mcp` and `context7-mcp` integrations. No crew: this blueprint
builds a tool surface rather than a product, and the two experts that
matter for it are the ones that read a boundary.

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.1.0 — 2026-09-22

Closes the findings of the first architecture and security review
([report](../../docs/reviews/dotnet-mcp-server/2026-09-22.md)).

- **The `http` transport refuses an unexpected `Origin`.** The MCP
  specification names DNS rebinding as how an insecure local server is reached:
  a browser is made to resolve an attacker's domain to `127.0.0.1` and posts to
  the port as same-origin. A browser always sends `Origin` on a cross-site
  request and no MCP client sends one at all, so refusing anything unexpected
  costs nothing. `AllowedOrigins` is empty by default, which refuses every
  request carrying the header. The recipe proves it: a request with
  `Origin: https://example.com` must come back 403.
- **`overview.md` puts the boundary where it belongs.** It said a server
  "reachable beyond localhost" needs authentication, which told the reader the
  machine was a boundary. It is not — every process on the host can call these
  tools. It now says so, and says `stdio` is the specification's first
  recommendation for a local server because the client owns the process and
  that is the access control.

- The step that reads the server's address out of its log waits sixty seconds
  rather than thirty. Thirty was enough until it was not: the first run of a
  freshly built binary on Windows exceeded it once during this release, and a
  verification that fails intermittently is worse than a slow one.

Minor rather than patch: the `http` option now refuses requests it previously
accepted.

## 1.0.1 — 2026-09-22

The recipe is now executed by `forgeprint test-setup` rather than followed by
hand, which changed how the HTTP transport proves itself.

- Removing the template's placeholder test is its own numbered step with a
  command.
- The HTTP check used to start the server with `dotnet run` in the foreground,
  which a script can never get past. It now starts the built assembly in the
  background, records its process id, and stops it at the end.
- It also asks the operating system for a port instead of taking 5199, and
  reads the address out of the server's own log. The fixed port was worse than
  a flaky check: during testing the request was answered by an unrelated server
  that happened to hold 5199, and the step passed. A check that can pass
  against somebody else's process is not a check.

Verified end to end on .NET SDK 10.0.103, for both transports: the stdio run
performs a full `initialize` / `tools/list` / `tools/call` exchange, and the
HTTP run an `initialize` against the port it was given.

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
