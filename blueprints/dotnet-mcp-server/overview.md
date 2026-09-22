# C# MCP Server

An MCP server in C#, on the official `ModelContextProtocol` SDK, that a coding
agent can connect to over stdio or streamable HTTP. It ships one working tool,
tests that keep tools reachable, and a CI workflow.

## What you get

- .NET 10 (LTS, supported to November 2028), SDK pinned by `global.json`
- The official `ModelContextProtocol` SDK, version pinned
- Attribute-based tool discovery, with a tool that answers over the wire
- A test project covering both behaviour and protocol exposure
- `scripts/probe.mjs`: a dependency-free client that performs a real
  `initialize` / `tools/list` / `tools/call` exchange, so "it builds" and "an
  agent can use it" are separate claims
- CI with actions pinned to commit SHAs and read-only workflow permissions

## Options

| Option      | Values          | What changes                                                                             |
| ----------- | --------------- | ---------------------------------------------------------------------------------------- |
| `transport` | `stdio`, `http` | Console or web project, the SDK package, the composition root, and how a client connects |

Pick `stdio` when the client runs the server itself, on the same machine — the
common case for a local tool. Pick `http` when the server is a service that
several clients or a remote client connect to.

## What it fits

- Exposing a system you own — an internal API, a database, a build system, a
  ticket tracker — to coding agents, in a language your team already maintains.
- Teams already on .NET that do not want a second runtime in the stack for the
  sake of one integration.
- A server you expect to grow: the tool boundary rules and the discovery tests
  exist because the tenth tool is where an MCP server usually goes wrong.

## What it is NOT for

- **An MCP client.** This is the server side. If you are embedding MCP into an
  application that calls servers, this is not that.
- **A REST API.** Even with the `http` option, what is served is the MCP
  transport, not a resource-oriented HTTP API. For that, use `dotnet-web-api`.
- **Wrapping an existing HTTP API you do not own.** Technically possible, often
  the wrong shape: an agent usually needs a handful of task-shaped tools, not a
  one-to-one mapping of somebody else's endpoints.
- **Learning MCP from zero.** The blueprint assumes you know what a tool call
  is. It will give you a working server and no understanding of the protocol.
- **Resources and prompts.** Only tools are wired. Both are registered the same
  way and are a small addition, but the recipe does not make it for you.
- **Authentication in front of the HTTP transport.** There is none, and
  localhost is not a boundary: every process on the machine can call these
  tools. The `http` option refuses requests carrying an unexpected `Origin`,
  which closes DNS rebinding — the MCP specification names it as how an
  insecure local server is reached — but that guard is not authentication.
  `stdio` is the specification's first recommendation for a local server,
  because the client owns the process and that _is_ the access control. Use
  `http` when something other than the client has to reach the server, and add
  authentication in the same change.
- **Publishing to a registry.** No packaging, no `dnx` manifest, no marketplace
  entry. What you get is a server you can run and connect.

## Trade-offs made on your behalf

**Attribute discovery, not manual registration.** `WithToolsFromAssembly` finds
tools by attribute. Less wiring, at the cost of a failure mode where a missing
attribute removes a tool silently — which is why every tool gets a discovery
test.

**One example tool, deliberately trivial.** `echo` proves the transport,
discovery and the client handshake all work, and it is obvious that it should be
deleted. A realistic example would get copied instead.

**A probe script rather than a protocol test library.** A dependency-free Node
script keeps the verification honest and readable: it is a real client doing a
real handshake. It is not a test framework, and it does not pretend to be.

**Logging to stderr, always.** Even under the HTTP transport, where stdout is
free. The same code should be able to run either way without a surprise.

**No authentication on the HTTP transport.** Adding a token check that looks
like security but is not would be worse than leaving it out and saying so.

## Cost of adoption

Under twenty steps, all `dotnet` CLI and file writes, a few minutes on a machine
that already has the SDK. The last step is a real MCP handshake, so a broken
result surfaces immediately rather than the first time an agent tries to use it.

## Maintenance

The SDK version is pinned, and so is the SDK feature band in `global.json`,
which CI reads from the same file. The protocol version is negotiated at
`initialize`, so a client newer than this server is handled by the SDK rather
than by your code.
