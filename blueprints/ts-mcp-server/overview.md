# TypeScript MCP Server

An MCP server on the official TypeScript SDK, with one working tool, tests that
speak the protocol rather than call the function, and a CI workflow. It ships
as an npm package, which is how almost every MCP server people install is
distributed.

## What it fits

- A server you intend to publish to npm and install with `npx`.
- Wrapping an API, a database or a local tool as MCP tools for an agent.
- A server that starts as `stdio` for local use and later grows an HTTP
  transport, or the reverse — the transport is a separate file from the tools.

## What it is NOT for

- **A client.** This builds a server. The SDK has a client too, and it is a
  different program with different concerns.
- **A hosted, multi-tenant service.** The HTTP option is stateless and binds to
  `127.0.0.1`. Authentication, authorisation and tenancy are not here, and
  bolting them onto this shape is more work than starting from something built
  for it.
- **A .NET server.** Use `dotnet-mcp-server`; it makes the same product
  decisions in C#.
- **Resources and prompts.** Only tools are wired up. Both are registered the
  same way, and neither is demonstrated.
- **A place to learn the protocol.** It assumes you have read what MCP is; the
  blueprint is about making one correctly, not about explaining the spec.

## Trade-offs made on your behalf

- **The server is a function, and the transport is an entry point.**
  `createServer()` returns a configured server and knows nothing about bytes;
  `bin.ts` and `http.ts` decide how it is reached. The tests drive the function
  directly through the SDK's in-memory transport, so they exercise the real
  protocol without a process boundary.
- **`node --test`, not a framework.** The runner is in Node. A starter that
  installs a test framework before it has a second test is spending somebody
  else's dependency budget.
- **Stateless HTTP.** No session identifiers, so the process can be restarted
  or replicated and no client notices. A stateful server is a different design
  and a bigger one.
- **Port 0 for HTTP.** The operating system picks a free port and the server
  prints it. A fixed default port is the fastest way to have a health check
  answered by something else entirely.
- **`exactOptionalPropertyTypes` is off.** Everything else in `strict` is on.
  The SDK's `StreamableHTTPServerTransport` declares `onclose` as
  `(() => void) | undefined`, which that flag refuses to pass to an optional
  property — and a cast at that boundary in a starter teaches the wrong habit.
  Turn it on when the SDK's types allow it.

## Cost of choosing it

The whole recipe runs in seconds and needs nothing but Node. The cost is not
setup time; it is that `echo` has to be deleted and replaced with tools that do
something, and the discovery test is the only thing that will notice if a new
tool never becomes reachable.
