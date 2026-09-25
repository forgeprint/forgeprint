# Cloudflare MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else runs and maintains.
> The upstream is [cloudflare/mcp](https://github.com/cloudflare/mcp), and the
> server itself is hosted by Cloudflare at `https://mcp.cloudflare.com/mcp`.
> **A hosted server cannot be pinned.** It has no release and no version in
> its URL: Cloudflare can change what it does at any time. What is written here
> was verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Cloudflare's general MCP server, and the one Cloudflare recommends first. Instead of one tool per API endpoint — about 2,500 of them — it gives the agent three:

- `docs` — searches Cloudflare's developer documentation.
- `search` — the agent writes JavaScript that queries Cloudflare's OpenAPI spec to find the endpoint it needs.
- `execute` — the agent writes JavaScript that calls `cloudflare.request()` against those endpoints. Cloudflare runs that code in an isolated Worker on its side and returns only the result.

That covers Workers, KV, R2, D1, Pages, DNS, firewall rules, load balancers, Access, AI Gateway, Vectorize and the rest of the API, plus the GraphQL Analytics API. `?codemode=false` on the URL registers one tool per endpoint instead, at roughly 244,000 tokens of tool definitions; the default is what this recipe installs.

**Other Cloudflare servers, not included.** Cloudflare also runs product-specific servers from a different repository, [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare): documentation (`docs.mcp.cloudflare.com`), Workers Bindings, Workers Builds, Observability, Containers, Browser Run, Logpush, AI Gateway, AutoRAG, Audit Logs, DNS Analytics, Digital Experience Monitoring, CASB, GraphQL, Radar and others, each at its own `*.mcp.cloudflare.com/mcp` URL with curated, typed tools. They are separate servers from a separate upstream, and this recipe installs none of them.

## What it can reach

Calls any Cloudflare API endpoint the permissions you grant allow, through code it runs on Cloudflare: Workers, DNS records, R2, KV, D1, firewall and Access settings, read and write, including deletes.

## Secrets it needs

None in the install command. The default is **OAuth**: the first time the
agent connects, you are sent to Cloudflare to sign in and **choose the
permissions** the agent gets. Complete it in your agent — `/mcp` in Claude
Code, `codex mcp login cloudflare-api` in Codex, `/mcp auth cloudflare-api` in
Gemini CLI. **The agent never signs in for you.**

For automation, Cloudflare also accepts an API token as a bearer token. Create
it in the Cloudflare dashboard (My Profile → API Tokens) with only the
permissions the work needs — user and account tokens both work; an account
token also needs **Account Resources : Read** so the server can find the
account ID, and tokens with client IP filtering are not supported. Keep it in
your environment as `CLOUDFLARE_API_TOKEN` and pass it by name, never by value:

- Claude Code: `claude mcp add-json cloudflare-api '{"type":"http","url":"https://mcp.cloudflare.com/mcp","headers":{"Authorization":"Bearer ${CLOUDFLARE_API_TOKEN}"}}'`
- Gemini CLI: `gemini mcp add --transport http cloudflare-api https://mcp.cloudflare.com/mcp --header 'Authorization: Bearer ${CLOUDFLARE_API_TOKEN}'`
- Codex: `codex mcp add cloudflare-api --url https://mcp.cloudflare.com/mcp --bearer-token-env-var CLOUDFLARE_API_TOKEN`

Codex stores only the variable's name (`bearer_token_env_var`) and reads the
token from your environment when it connects. For Gemini CLI, keep the single
quotes: they stop your shell from expanding the variable, so Gemini CLI stores
the reference and expands it when it starts.

## Install

**claude-code**

```bash
claude mcp add --transport http cloudflare-api https://mcp.cloudflare.com/mcp
```

**codex**

```bash
codex mcp add cloudflare-api --url https://mcp.cloudflare.com/mcp
```

**gemini-cli**

```bash
gemini mcp add --transport http cloudflare-api https://mcp.cloudflare.com/mcp
```

Cloudflare documents the server URL and a JSON entry, not a command per
agent. The commands above are each agent's own documented form for a remote
HTTP server, which discovers the OAuth flow from the server. Cloudflare also
offers a Claude Code plugin (`cloudflare/skills`) that installs its servers
with skills and commands; it is not pinned and not what this recipe installs.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**The permissions you grant are the only boundary.** There is no read-only
mode and no tool list to trim: `execute` can call every endpoint the OAuth
grant or the token allows, and the agent writes the code. Changing a DNS
record, deploying or deleting a Worker, emptying an R2 bucket or opening a
firewall rule is one call. Grant read permissions only unless a write is the
point, limit them to the one account and zone the work touches, and keep your
agent's approval prompt on for `execute` — read the code before you approve it.

**Code runs on Cloudflare, not on your machine.** The JavaScript the agent
writes for `search` and `execute` is sent to Cloudflare and run in an isolated
Worker there. Whatever the agent puts in that code — including values from
your project — leaves the machine.

**Results can be large or cut.** Each result is capped at about 6,000 tokens by
default and marked `--- TRUNCATED ---` where it was cut; `?truncateToolResult=false`
turns the cap off, and then a broad query can return megabytes into the
agent's context.

**Some features cost money.** Cloudflare notes that some features need a paid
Workers plan; creating resources through the API can start billing on your
account.

## Updating

There is no pin to move: the server is whatever Cloudflare runs today. Re-read
the upstream README and Cloudflare's MCP servers page, and change
`verified_on`, the permissions and the install commands together in one pull
request.
