# C# MCP Server — agent context

Context for an agent working in a project created from the `dotnet-mcp-server`
blueprint. Read it before adding a tool.

---

## What this project is

An MCP server written in C# on the official `ModelContextProtocol` SDK. It
exposes tools to coding agents over one of two transports: stdio, where the
client launches the process, or streamable HTTP, where the client calls a URL.

## Layout

```
global.json                     SDK pin — do not bump without bumping CI too
Mcp.slnx                        solution
src/Mcp.Server/
  Program.cs                    host, transport and tool discovery
  Tools/                        one file per tool group
tests/Mcp.Server.Tests/         unit and discovery tests
scripts/probe.mjs               protocol-level smoke test
.github/workflows/ci.yml        restore, build, test
```

## Rules for this project

### Never write to stdout

On the stdio transport, stdout **is** the protocol channel. A stray
`Console.WriteLine`, a library that prints a banner, or a logger with a console
sink corrupts the JSON-RPC stream, and the client sees a parse error rather
than your message. Logging is configured to stderr for exactly this reason.

This holds even on the HTTP transport, because the same code is expected to run
under either one.

### A tool is a contract, not a function you happened to expose

Before adding a tool, decide what an agent should be able to ask for. Then:

- **Name it for the task, not the implementation.** `search_invoices`, not
  `run_query`.
- **Write the description for a reader who cannot see the code.** The
  description is the entire basis on which an agent decides whether to call it.
  Say what it does, what it returns, and when it is the wrong choice.
- **Describe every parameter.** An undescribed parameter gets guessed.
- **Return text an agent can act on.** A stack trace is not an error message. If
  a call fails, say what failed and what would make it succeed.
- **Keep the surface small.** Five well-described tools beat twenty that overlap.
  Two tools whose descriptions both fit the same request is a design problem,
  not the agent's problem.

### Attributes are load-bearing

`[McpServerToolType]` on the class and `[McpServerTool]` on the method are what
make a method reachable. Remove either and the code still compiles, the tests
still pass if they only call the method directly, and the tool silently
disappears from the protocol.

That is why every tool gets a discovery test asserting its attributes, not just
a behaviour test. Follow the pattern in `EchoToolsTests`.

### Tools run on somebody else's machine

The server receives input from a model. Treat every argument as untrusted:

- Never pass an argument into a shell.
- Validate paths against a root you control; reject anything that escapes it.
- Do not accept a connection string, a URL or a command as a parameter and then
  act on it. Configure those; do not let a call choose them.
- Return data. Side effects that are hard to reverse need the caller's
  confirmation, which means a separate, explicitly named tool.

### Long work needs a cancellation token

Accept a `CancellationToken` parameter on anything that can take time and pass
it down. The SDK supplies it. A tool that ignores cancellation keeps working
after the client has given up.

### Keep the transport out of the tools

Tool code must not know whether it is running under stdio or HTTP. Anything
transport-specific belongs in `Program.cs`. This is what lets the same server
ship both ways.

## Commands

| Task                | Command                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| Build               | `dotnet build`                                                                  |
| Test                | `dotnet test`                                                                   |
| Run (stdio)         | `dotnet run --project src/Mcp.Server`                                           |
| Run (HTTP)          | `dotnet run --project src/Mcp.Server --urls http://localhost:5199`              |
| Protocol smoke test | `node scripts/probe.mjs dotnet src/Mcp.Server/bin/Debug/net10.0/Mcp.Server.dll` |

## When you are asked to add a tool

1. Write down the request an agent would make, in one sentence. If you cannot,
   the tool is not ready to be written.
2. Add the method to the matching file in `Tools/`, or a new file if it is a new
   area.
3. Give the method and every parameter a `[Description]`.
4. Add a behaviour test and a discovery test.
5. Run `dotnet test`, then run the probe and confirm the tool appears in
   `tools/list` and answers a `tools/call`. A tool that is not in `tools/list`
   does not exist, whatever the tests say.
