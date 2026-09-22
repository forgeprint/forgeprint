# Changelog

All notable changes to this blueprint. The version here matches `version` in
`manifest.yaml`, and every version bump needs an entry.

## 1.1.0 — 2026-09-22

Closes the findings of the first architecture and security review
([report](../../docs/reviews/ts-mcp-server/2026-09-22.md)).

- **The `http` transport refuses an unexpected `Origin`.** The MCP
  specification names DNS rebinding as how an insecure local server is reached:
  a browser is made to resolve an attacker's domain to `127.0.0.1` and posts to
  the port as same-origin. A browser always sends `Origin` on a cross-site
  request and no MCP client sends one at all, so refusing anything unexpected
  costs nothing. `ALLOWED_ORIGINS` is empty by default, which refuses every
  request that carries the header. The recipe now proves the guard: a request
  with `Origin: https://example.com` must come back 403, and that check fails
  the day somebody removes it.
- **`overview.md` and `AGENTS.md` put the boundary where it belongs.** The
  option was described as unsuitable for hosting, which implied the machine
  itself was a boundary. It is not: every process on the host can call these
  tools. `stdio` is now stated as the safer default — the client owns the
  process, and that is the access control — and adding a tool with a side
  effect means adding authentication in the same change.
- **The lockfile is named as a file to commit.** The CI workflow runs `npm ci`,
  which fails without `package-lock.json`, so the workflow could not run on a
  fresh clone. It is also the only artefact that pins what the dependencies
  pull in.
- A note where `SERVER_VERSION` is written, because it must match
  `package.json` and nothing enforces it. Forgeprint's own server shipped that
  drift for three releases.

- The step that reads the server's address out of its log waits sixty seconds
  rather than thirty. Thirty was enough until it was not: the first run of a
  freshly built binary on Windows exceeded it once during this release, and a
  verification that fails intermittently is worse than a slow one.

Minor rather than patch: the `http` option now refuses requests it previously
accepted.

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
