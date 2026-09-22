# Python MCP Server — agent context

An MCP server on the official Python SDK. Read this before adding a tool.

> This blueprint was generated from the catalog's own demand research and its
> recipe is executed in CI, but nobody has reviewed the steps by hand. Treat
> the design decisions below as a starting point that runs, not as a design
> somebody has depended on in production.

## The shape

```
app/server.py        create_server(): the tools, and nothing about transport
app/__main__.py      stdio entry point
app/http.py          streamable HTTP entry point (http option only)
tests/test_server.py the protocol, driven in-process
scripts/probe.py     the installed server, driven over stdio
```

`create_server()` is the whole server, and it is a **function**, not a
module-level object. The tests need a fresh server per test and the entry
points need one configured from the environment; a singleton at import time
makes the first impossible and the second a surprise.

The entry points decide how bytes reach the server and do nothing else. The
moment a tool needs to know which transport it is running under, something has
been wired in the wrong place.

## Rules that are not style preferences

**Nothing may write to stdout.** Under stdio, stdout _is_ the protocol. A
`print()` left in a tool is a malformed message to the client, and the failure
surfaces as a parse error somewhere else entirely. Write to stderr
(`print(..., file=sys.stderr)`) or use `logging`, which does.

**Every tool needs a docstring an agent can act on.** The SDK sends the
docstring to the client as the tool's description, so it is not documentation
for you — it is the only thing a model has when deciding whether to call it.
"Handles user data" causes a wrong call; "Look up one customer by id; returns
nothing if there is no such customer" does not.

**Type the parameters.** The SDK builds the input schema from the annotations,
so `def add(a: int, b: int) -> int` is what tells the client that `a` is a
number. An untyped parameter reaches the model as an unconstrained value, and
the validation you write inside the function happens after the model has
already guessed.

**A tool returns a value, not an exception.** Raising produces a protocol
error, which tells the model nothing it can act on. Return the failure as
content — a string saying what went wrong — and reserve raising for the case
where continuing would be wrong.

**Do not read configuration inside a tool.** Read it when the server is built,
so a missing variable stops the process rather than failing the first call that
happens to need it.

## The HTTP transport is exposed to the browser

Under the `http` option the server listens on a loopback port, and a page in
the user's browser can send requests to `127.0.0.1`. That is the DNS-rebinding
problem, and the SDK has the answer built in: `TransportSecuritySettings` with
`allowed_origins` and `allowed_hosts`, enabled by default.

Do not disable it, and do not add `"*"` to `allowed_origins` to make a client
work. An empty allow-list is the correct default — it refuses every request
that carries an `Origin` header at all, which is every request from a page. The
setup proves this with a step that expects `403`; if that step starts passing
for the wrong reason, the guard is gone.

## Adding a tool

1. Write the function in `app/server.py`, inside `create_server()`, decorated
   with `@server.tool()`.
2. Annotate every parameter and the return type.
3. Write the docstring for a model, not for a reviewer.
4. Add a test that calls it through `Client`, not one that calls the function.
   A test that calls the function directly passes when the tool is not
   registered at all.

## What this does not do

No authentication, no rate limiting, no persistence. The SDK has
`auth_server_provider` and `token_verifier` for OAuth; this blueprint does not
configure them, because a server that runs on a developer's machine over stdio
has no user to authenticate. If you expose the HTTP transport beyond loopback,
that decision changes and this blueprint stops covering you.
