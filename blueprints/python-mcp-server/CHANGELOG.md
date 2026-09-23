# Changelog — python-mcp-server

## 1.0.0 — 2026-09-23

First version.

An MCP server on the official Python SDK 2.2.0, over stdio or streamable HTTP,
with tests that drive the real protocol in-process and a step that proves a
foreign `Origin` is refused with 403.

**Generated** from the catalog's own demand research
([the report of 2026-09-23](../../docs/research/2026-09-23-demand.md)), where a
Python MCP server was the clearest gap: the Python SDK is downloaded at a scale
close to the TypeScript one, and the catalog carried that blueprint in
TypeScript and C# only. Its recipe runs in CI like every other, and nobody has
built on it — so it is `tier: community`, and it says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Deliberately parallel to `ts-mcp-server` and `dotnet-mcp-server`: the same two
transports, the same shape of test, and the same proof about `Origin`. The
differences are the ones Python forces — `create_server()` is a function
because the tests need a fresh server, and the SDK's own
`TransportSecuritySettings` replaces the middleware the other two write by
hand.
