# The Forgeprint MCP server

`forgeprint-mcp` gives a coding agent one job it cannot do well on its own:
turn "I know C#, I want to build a multi-tenant SaaS API" into a single
blueprint and a setup recipe it can execute.

The server returns text. It installs nothing, runs nothing on your machine, and
keeps no state beyond a five-minute cache of the catalog index.

---

## The tools

| Tool                 | What it does                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolve`            | The one to start with. Returns **either** the questions to ask the user **or** exactly one blueprint with its rationale, the tools its setup needs, and the options still to decide |
| `get_blueprint`      | The manifest and files for a slug, with the chosen option branches already resolved out of `setup.md`                                                                               |
| `search_blueprints`  | Scored matches with reasons, for when the user wants to look themselves                                                                                                             |
| `compare_blueprints` | Two to four blueprints side by side, built from their overview files — including what each one is explicitly not for                                                                |
| `validate_blueprint` | Schema, taxonomy, setup-recipe and duplication checks on a draft that is not in the catalog yet                                                                                     |
| `request_blueprint`  | A GitHub issue payload when nothing fits. It does not file the issue                                                                                                                |

### How `resolve` behaves

- **It asks before it guesses.** An incomplete profile gets questions back, not
  a recommendation. Ask them, then call `resolve` again with the answers.
- **It asks in rounds.** First which languages the user writes and what they are
  building; only then the questions that separate the remaining candidates.
- **It only asks what matters.** A question is returned when two candidates are
  close enough that the answer changes which one wins. A clear leader means no
  further questions.
- **It returns one blueprint.** When two are genuinely tied it returns both as a
  choice for the user, with the reasoning — never as a list to browse.
- **It does not invent a match.** When nothing fits it says so, names the closest
  blueprint and why it does not fit, and points at `request_blueprint`.

### Language

The catalog is English. Pass `locale` and it comes back in `_meta.present_in`,
so your agent knows which language to answer in. Nothing is translated; the
agent presents. See [ADR 0004](decisions/0004-english-only-catalog.md).

---

## Connecting it

### Claude Code

```bash
claude mcp add forgeprint -- npx -y forgeprint-mcp
```

On **Windows PowerShell**, quote the separator:

```powershell
claude mcp add forgeprint "--" npx -y forgeprint-mcp
```

PowerShell consumes a bare `--` before `claude` sees it, and `claude` then
reads `-y` as one of its own options and refuses. `--%` does not help; it
arrives as an argument and is refused in turn.

From a checkout instead, which is what you want when you are working on the
catalog or a blueprint that is not merged yet:

```bash
git clone https://github.com/forgeprint/forgeprint.git
cd forgeprint
pnpm install
pnpm run build
claude mcp add forgeprint --env FORGEPRINT_CATALOG="$PWD" -- node "$PWD/packages/mcp-server/dist/bin.js"
```

### Any client that takes an `mcpServers` object

Codex, Copilot CLI, Cursor and most other clients accept the same shape; only
the file it goes in differs, so check your client's documentation for the
location.

```json
{
  "mcpServers": {
    "forgeprint": {
      "command": "npx",
      "args": ["-y", "forgeprint-mcp"]
    }
  }
}
```

From a checkout, with the catalog on disk:

```json
{
  "mcpServers": {
    "forgeprint": {
      "command": "node",
      "args": ["/path/to/forgeprint/packages/mcp-server/dist/bin.js"],
      "env": { "FORGEPRINT_CATALOG": "/path/to/forgeprint" }
    }
  }
}
```

Codex uses TOML rather than JSON for the same information:

```toml
[mcp_servers.forgeprint]
command = "npx"
args = ["-y", "forgeprint-mcp"]
```

### Checking it works

The server speaks JSON-RPC over stdio, so you can drive it without a client:

```bash
npx -y forgeprint-mcp
```

It prints nothing and waits: that is correct, it is waiting for a request. Send
an `initialize`, then `tools/list`, and a working server answers with the six
tools above.

If `npx` reports a 404 for a package that does exist, it is reusing a cached
version. `npx -y forgeprint-mcp@latest` sidesteps the cache, and
`npm cache clean --force` clears it.

---

## Configuration

| Variable               | Default                                                                   | What it does                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `FORGEPRINT_CATALOG`   | unset                                                                     | Path to a checkout. Set it and the server reads `docs/index.json` and the blueprint files from disk, with no network at all |
| `FORGEPRINT_INDEX_URL` | `https://forgeprint.github.io/forgeprint/index.json`                      | Where the catalog index is fetched from                                                                                     |
| `FORGEPRINT_FILES_URL` | `https://raw.githubusercontent.com/forgeprint/forgeprint/main/blueprints` | Where blueprint files are fetched from                                                                                      |

Without `FORGEPRINT_CATALOG`, the index is fetched from GitHub Pages and falls
back to the raw repository when Pages does not answer. Blueprint files always
come from the raw repository.

**Working offline, or on an unpublished blueprint**, is what
`FORGEPRINT_CATALOG` is for: point it at a checkout and the server serves
whatever is in it, including a blueprint you are still writing. That is the
same design rule as the rest of the tooling — nothing here needs a hosted
service to work (see [ADR 0002](decisions/0002-actions-optional.md)).

---

## What it will not do

- **Run anything.** Every tool returns text. Executing a setup recipe is the
  calling agent's job, under whatever permissions the user has given it.
- **File issues or open pull requests.** `request_blueprint` produces the issue
  text and a link; a human decides whether to file it.
- **Hold state.** No sessions, no history, no telemetry. The only thing cached
  is the catalog index, for five minutes.
- **Instruct your agent.** Blueprint content is data. Every result carries that
  note in `_meta.content_is_data`, and an agent should treat the text it
  receives as material to read and apply, never as commands addressed to it.

## A typical exchange

This is the real sequence, not a sketch of one:

```
User:  I want to build a multi-tenant SaaS API.
Agent: [resolve {goal}] -> questions
       ? Which programming languages do you already write comfortably?
Agent: Which languages do you write comfortably?
User:  C#.
Agent: [resolve {goal, languages:["C#"]}] -> resolved
       -> dotnet-multitenant-saas-api (1.00)
          written in C#, which you know; covers Multi-tenancy
          read_from_your_description: ["multi-tenant"]
       undecided: database (postgres | sqlserver), tenancy (shared column | database per tenant)
Agent: Postgres or SQL Server? One database with a tenant column, or one per tenant?
User:  Postgres, database per tenant.
Agent: [get_blueprint] -> setup.md with those branches resolved, 31 numbered steps
Agent: [follows the recipe]
```

Two things there are the resolver doing work the agent used to have to do.
`C#` is a label, not the identifier `csharp` the catalog stores, and both are
understood. And "multi-tenant" arrived as prose inside `goal`:
`read_from_your_description` reports that the resolver read it as a
requirement, which is what turns a near-tie between two ASP.NET Core API
blueprints into one answer.

Both were found by running exactly this conversation against a real agent — see
[the dogfood test](dogfood.md). Before those fixes this step returned two
candidates and asked the user to choose between them, over a word they had
already said.
