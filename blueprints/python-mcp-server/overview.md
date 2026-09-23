# Python MCP Server

An MCP server in Python on the official SDK, with one working tool, tests that
speak the protocol rather than calling the function, and a CI workflow. Two
transports: stdio for a server a client launches, streamable HTTP for one that
already runs.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint in this catalog. What has not happened is a
person building something real on it first, which is what `tier: official`
means here and why this is `community`.

## What it fits

- A tool an agent should be able to call on a developer's machine — a lookup, a
  calculation, a query against something the developer already has.
- A team already writing Python that does not want the server to be the one
  TypeScript project in the repository.
- Wrapping an existing Python library as an MCP server. The SDK reads the type
  annotations and the docstring you already wrote.
- A first MCP server. Registering a tool is a decorator and a function, and the
  test drives the real protocol in-process, so there is nothing to mock.

## What it is NOT for

- **A server on the public internet.** The HTTP transport binds to loopback and
  refuses cross-origin requests. Exposing it further is authentication, rate
  limiting and a threat model this blueprint does not carry.
- **Authentication.** The SDK supports OAuth token verification; this does not
  configure it. A server a client launches over stdio inherits the user's own
  process — there is nobody else to authenticate. That reasoning stops holding
  the moment the server is reachable from elsewhere.
- **Rate limiting.** Nothing bounds how often a tool can be called
  (OWASP API4:2023). Under stdio the caller is the user's own agent, so the
  limit is their patience; over HTTP, beyond loopback, it would be a gap.
- **Long-running work.** Tools here return a value. Work that takes minutes
  needs progress notifications or a job the agent can poll, and neither is set
  up.
- **Persistence.** No database, no state between calls.

## Pros

- **The tests speak MCP.** `Client(create_server())` drives the real protocol
  in-process — no subprocess, no port, no mock. A test that calls the Python
  function directly would pass while the tool was not registered at all; this
  one would not.
- **The rebinding guard is proven, not asserted.** The recipe sends a request
  with a foreign `Origin` and requires `403`. That step fails the day somebody
  widens the allow-list to make a client work.
- **Transport is a decision made once.** `create_server()` knows nothing about
  it; the entry points know nothing else.
- **Versions are pinned**, including the development set, and CI installs from
  the same file the recipe does.

## Cons

- **Nobody has run this in anger.** See the notice above. The two hand-written
  MCP blueprints in this catalog came out of projects that existed first.
- **The SDK moves.** `FastMCP` became `MCPServer`; 2.x is not 1.x. Pinning
  protects the recipe and means you will do a real upgrade eventually.
- **stdio is unforgiving about stdout.** One stray `print()` corrupts the
  protocol, and the error surfaces somewhere else. `AGENTS.md` says so twice
  because it is the mistake everybody makes once.
- **One tool, deliberately.** You are meant to delete `add` and write yours; if
  you wanted a catalogue of example tools, this is not it.
- **`python>=3.10`.** The SDK requires it. On an older interpreter the install
  fails at the first step rather than somewhere confusing later, which is the
  better failure, but it is still a wall.

## Compared with the alternatives here

- **`ts-mcp-server`** — the same server in TypeScript, hand-written, `official`.
  Pick it when the surrounding repository is TypeScript, or when you want the
  blueprint a person stands behind.
- **`dotnet-mcp-server`** — the same in C#, hand-written, `official`.

The three are deliberately parallel: same two transports, same proof that a
foreign origin is refused, same shape of test. Choosing between them should be
a question about your repository, not about the blueprints.
