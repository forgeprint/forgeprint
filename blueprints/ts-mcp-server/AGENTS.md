# TypeScript MCP Server — agent context

An MCP server on the official TypeScript SDK. Read this before adding a tool.

## The shape

```
src/server.ts        createServer(): the tools, and nothing about transport
src/bin.ts           stdio entry point
src/http.ts          streamable HTTP entry point (http option only)
src/server.test.ts   the protocol, driven in memory
scripts/probe.mjs    the built executable, driven over stdio
```

`createServer()` is the whole server. The entry points decide how bytes reach
it and do nothing else. Keep it that way: the moment a tool needs to know which
transport it is running under, something has been wired in the wrong place.

## Rules that are not style preferences

**Nothing may write to stdout.** Under stdio, stdout _is_ the protocol. A
`console.log` left in a tool is a malformed message to the client, and the
failure looks like a parse error somewhere else entirely. Use `console.error`,
which is stderr, or a logger that writes there.

**Every tool needs a description an agent can act on.** The description is not
documentation for you; it is the only thing a model has when deciding whether
to call it. Say what it does and when to use it. "Handles user data" causes a
wrong call; "Look up one customer by id; returns nothing if there is no such
customer" does not.

**Validate arguments in the schema, not in the body.** `inputSchema` is zod, it
reaches the client as JSON Schema, and a constraint expressed there is enforced
before your code runs and visible to the model before it calls. A check inside
the handler is invisible and later.

**A tool returns content, not exceptions.** Throwing produces a protocol error;
returning `{ isError: true, content: [...] }` tells the model what went wrong
in words it can act on. Reserve throwing for the case where continuing would be
wrong.

## Adding a tool

1. `server.registerTool(name, { title, description, inputSchema }, handler)` in
   `src/server.ts`.
2. Add it to the discovery assertion in `src/server.test.ts`. That test exists
   so that a tool which never becomes reachable fails loudly instead of
   silently not existing.
3. Test the behaviour through `client.callTool`, not by calling the handler.
   The round trip is where schema mistakes show up.

## Transports

`stdio` is for a server the user runs locally; the client starts the process.
`http` is streamable HTTP, stateless, bound to `127.0.0.1`. Statelessness is a
decision: no session identifiers, so nothing has to be kept between requests.
Making it stateful means `sessionIdGenerator` and somewhere to keep sessions,
and it changes how the server can be deployed.

The HTTP entry point asks the operating system for a port and prints it to
stderr. Do not replace that with a fixed port for convenience — a fixed port is
how a health check ends up answered by a different process.

## Publishing

`bin` in `package.json` is what makes `npx <name>` work, and `files` decides
what ships. Build before publishing: `dist` is the package, `src` is not. If
this server is meant to be found, the official registry wants an `mcpName`
field matching a `server.json`.

## What is not here

No resources, no prompts, no authentication, no session storage. Each is a
deliberate omission rather than an oversight; `overview.md` says which and why.
