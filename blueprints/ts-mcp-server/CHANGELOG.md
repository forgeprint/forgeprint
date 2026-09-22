# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.0.0 — 2026-09-22

First release.

- MCP server on `@modelcontextprotocol/sdk` 1.30.0, pinned exactly, with zod
  4.6.5 for tool input schemas and TypeScript 6.0.3.
- `createServer()` holds the tools and knows nothing about transport; the entry
  points hold the transport and nothing else. The tests drive the server
  through the SDK's in-memory transport, so they speak the real protocol
  without a process boundary.
- `transport` option:
  - `stdio` — the client starts the process. `scripts/probe.mjs` runs the built
    executable and completes a real handshake, which is what catches a wrong
    entry point or anything written to stdout.
  - `http` — streamable HTTP, stateless, bound to `127.0.0.1` on a port the
    operating system picks. Verified by sending a real `initialize` request and
    reading the protocol version back.
- Three tests: the tools a client can discover, a call and its answer, and an
  argument the schema refuses.
- CI workflow with `actions/checkout` and `actions/setup-node` pinned to commit
  SHAs, and read-only workflow permissions.
- `requires_tools` declares `curl`, which the `http` branch uses to send the
  `initialize` request. Declared from the start rather than discovered later,
  the way `dotnet-web-api` discovered it.
- `exactOptionalPropertyTypes` is off and every other `strict` flag is on. The
  SDK's `StreamableHTTPServerTransport` types `onclose` as
  `(() => void) | undefined`, which that flag will not pass to an optional
  property. A cast at the boundary would hide it; leaving the flag off and
  saying why does not.

Verified on Windows with Node 22.12.0, for both transports: build, the three
tests, the stdio handshake against the built executable, and an `initialize`
round trip over HTTP.
