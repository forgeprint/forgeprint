# forgeprint-mcp

The [Forgeprint](https://github.com/forgeprint/forgeprint) MCP server: it turns
"I know C#, I want to build a multi-tenant SaaS API" into **one** blueprint and
a setup recipe your agent can execute.

It returns text. It installs nothing, runs nothing on your machine, and keeps no
state beyond a five-minute cache of the catalog index.

```bash
npx -y forgeprint-mcp
```

Claude Code:

```bash
claude mcp add forgeprint -- npx -y forgeprint-mcp
```

On Windows PowerShell, quote the separator:
`claude mcp add forgeprint "--" npx -y forgeprint-mcp`.

Any client that takes an `mcpServers` object:

```json
{
  "mcpServers": {
    "forgeprint": { "command": "npx", "args": ["-y", "forgeprint-mcp"] }
  }
}
```

## Tools

| Tool                 | What it does                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `resolve`            | Start here. Returns **either** the questions to ask the user **or** exactly one blueprint with its rationale |
| `get_blueprint`      | Manifest and files for a slug, with the chosen option branches resolved out of `setup.md`                    |
| `search_blueprints`  | Scored matches with reasons                                                                                  |
| `compare_blueprints` | Two to four blueprints side by side, including what each is explicitly **not** for                           |
| `validate_blueprint` | Schema, taxonomy, setup and duplication checks on a draft                                                    |
| `request_blueprint`  | A GitHub issue payload when nothing fits. It does not file it                                                |

Every tool is listed with `readOnlyHint: true` and `openWorldHint: false`, so a
client has no reason to confirm a call as destructive. The default catalog is
fetched over the network, but from two fixed addresses serving the same one
catalog; no tool takes a URL or reaches anything else, which is the closed
domain the specification means. `destructiveHint` and `idempotentHint` are left
out because the specification reads them only on tools that are not read-only.

`resolve` asks before it guesses, asks in rounds, and only asks questions whose
answers would change which blueprint wins. It never returns a list to browse,
and never invents a match.

## Protocol

The server is built on `@modelcontextprotocol/sdk` 1.30.0, pinned exactly.
That release implements MCP revision **2025-11-25**: its `LATEST_PROTOCOL_VERSION`
is `'2025-11-25'`, and it also negotiates 2025-06-18, 2025-03-26, 2024-11-05
and 2024-10-07 (`src/types.ts` at the `1.30.0` tag). It does not implement
2026-07-28. The tool annotations above mean the same in both revisions.

## Configuration

| Variable               | Default             | What it does                                                                                  |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `FORGEPRINT_CATALOG`   | unset               | Path to a checkout. Set it and the server reads the catalog from disk, with no network at all |
| `FORGEPRINT_INDEX_URL` | the published index | Where the catalog index is fetched from                                                       |
| `FORGEPRINT_FILES_URL` | the raw repository  | Where blueprint files are fetched from                                                        |

Full documentation:
[docs/mcp.md](https://github.com/forgeprint/forgeprint/blob/main/docs/mcp.md).

## Licence

PolyForm Shield 1.0.0 — see `LICENSE`. Forgeprint is source-available, not OSI
open source. The blueprints it serves are CC BY 4.0.
