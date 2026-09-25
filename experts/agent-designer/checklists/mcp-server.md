# MCP server

Run for any Model Context Protocol server, after [`tool-design`](tool-design.md).
Built to the revision named in the README; the rows below are written against
**2026-07-28**. When the revision moves, re-check each row before citing it.

| #    | Check                                                                                                                       | How                                                                            | Source                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| MS1  | The README names the protocol revision the server is built against                                                          | read the README                                                                | MCP 2026-07-28, changelog                               |
| MS2  | Every `inputSchema` is a valid JSON Schema object; a tool with no parameters uses `additionalProperties: false`             | validate each schema                                                           | MCP 2026-07-28, tools                                   |
| MS3  | Input validation, API and business-rule failures come back as results with `isError: true`, not as protocol errors          | call a tool with a bad argument; read the response shape                       | MCP 2026-07-28, tools — error handling                  |
| MS4  | Annotations are set and honest: `readOnlyHint` on every read; `destructiveHint: false` only where nothing is overwritten    | compare each tool's annotations with what its code does                        | MCP 2026-07-28, schema — `ToolAnnotations`              |
| MS5  | Where an `outputSchema` is declared, every `structuredContent` conforms, and the same JSON is also returned as text         | validate one response per tool against its schema                              | MCP 2026-07-28, tools — output schema                   |
| MS6  | State that spans calls is an explicit, opaque handle, bound to the caller, with its lifetime stated in the tool description | find the handle; check the server looks it up per caller                       | MCP 2026-07-28, tools — stateful tools; MCP security BP |
| MS7  | Inputs are validated, access is controlled, invocations are rate limited, and outputs are sanitised                         | find each of the four in the code                                              | MCP 2026-07-28, tools — security considerations         |
| MS8  | No token is accepted unless it was issued for this server, and none is forwarded downstream                                 | read the token validation: audience is checked; the upstream call uses its own | MCP security BP — token passthrough                     |
| MS9  | Scopes are minimal and specific; no wildcard or omnibus scope                                                               | read `scopes_supported` and the scope challenges                               | MCP security BP — scope minimization                    |
| MS10 | A server meant to run locally uses stdio, or HTTP with an authorization token                                               | read the transport setup                                                       | MCP security BP — local server compromise               |
| MS11 | `tools/list` returns the same set in the same order for the same authorization                                              | call it twice; compare                                                         | MCP 2026-07-28, tools — capabilities                    |

## Why each one

**MS3 is the specification doing the agent's work for it.** Tool execution
errors are meant to reach the model so it can correct itself; protocol errors
often do not. A server that throws a JSON-RPC error for a malformed date has
taken the recovery away.

**MS4** matters because clients use annotations to decide what to confirm.
`destructiveHint` defaults to `true`; a server that sets it to `false` on a
tool that overwrites data has talked the client out of asking the user.

**MS8** is the one the specification forbids outright. A server that accepts a
token meant for somebody else and forwards it becomes a confused deputy, and
the downstream logs show the wrong caller.
