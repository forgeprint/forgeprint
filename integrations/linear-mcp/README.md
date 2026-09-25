# Linear MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else runs and maintains.
> The upstream is Linear's own documentation, [linear.app/docs/mcp](https://linear.app/docs/mcp);
> Linear publishes no source repository for it, and the server is hosted by
> Linear at `https://mcp.linear.app/mcp`.
> **A hosted server cannot be pinned.** It has no version, so this recipe
> records it as `hosted`: Linear can change the tools behind it at any time.
> What is written here was verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Linear's official remote MCP server. Find issues, read projects and comments, and — on the full endpoint — create and update them, from the agent, without leaving the terminal. Linear hosts it, so there is nothing to run locally.

## What it can reach

As installed, reads the issues, projects and comments the signed-in user can see. The full /mcp endpoint, which you opt into, also creates and updates them.

## Secrets it needs

None in the install command. The default is **OAuth 2.1**: the first time the
agent connects, a browser window opens and you sign in to Linear yourself.
Complete that flow in your agent — `/mcp` in Claude Code, `codex mcp login linear`
in Codex, `/mcp auth linear` in Gemini CLI. **The agent never signs in for you.**

Linear also accepts an OAuth token or a Linear API key in an
`Authorization: Bearer` header instead of the interactive flow. If you go that
way, create the key in Linear yourself, give it the narrowest permissions Linear
offers (a read-only key exists), keep it in your environment, and pass it by
variable reference — never paste the value into a command.

## Install

The commands below use the **read-only endpoint**, `https://mcp.linear.app/mcp/readonly`,
which only ever exposes read tools. That is the default here on purpose.

**claude-code**

```bash
claude mcp add --transport http linear-server https://mcp.linear.app/mcp/readonly
```

**codex**

```bash
codex mcp add linear --url https://mcp.linear.app/mcp/readonly
```

**gemini-cli**

```bash
gemini mcp add --transport http linear https://mcp.linear.app/mcp/readonly
```

The Claude Code and Codex commands are the ones Linear documents, with one
change: the endpoint path ends in `/readonly`. Linear does not document a Gemini
CLI command; the one above is Gemini CLI's own documented form for a remote HTTP
server, which discovers the OAuth flow from the server. Linear's page also says
that a first-time Codex MCP user may need `experimental_use_rmcp_client = true`
under `[features]` in `~/.codex/config.toml`; Codex's own MCP documentation
does not mention it.

**When writes are the point.** Replace `https://mcp.linear.app/mcp/readonly` with
`https://mcp.linear.app/mcp` in the command. That endpoint exposes the tools that
create and update issues, projects and comments. Do it deliberately, for the
work that needs it — not as the starting point.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

The agent acts as you, with every team and issue you can see. On the read-only
endpoint that means it can read everything you can, including private teams you
belong to; decide whether that is wanted before signing in. On the full endpoint
it can also change issues other people are tracking, so keep your agent's
per-tool approval prompts on for the write tools. Linear offers a second way to
stay read-only — requesting only the `read` OAuth scope on the full endpoint —
but the `/readonly` endpoint is the one a command can pin down, which is why it
is used here. The legacy SSE endpoint, `https://mcp.linear.app/sse`, exists only
for clients without Streamable HTTP; none of the agents above need it.

## Updating

There is no pin to move: the server is whatever Linear runs today. Re-read
[linear.app/docs/mcp](https://linear.app/docs/mcp), and change `verified_on`
and the install commands together in one pull request.
