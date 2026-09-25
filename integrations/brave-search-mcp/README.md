# Brave Search MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [brave/brave-search-mcp-server](https://github.com/brave/brave-search-mcp-server),
> pinned at `2.1.4` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Brave's own server for the Brave Search API, which searches Brave's independent web index rather than reselling another engine's results. Eight tools, all searches:

- `brave_web_search`, `brave_news_search`, `brave_image_search`, `brave_video_search` — results of each kind, with filters for country, language, freshness and safe search.
- `brave_llm_context` — the text of the top results, extracted and trimmed for an agent to ground an answer on, instead of a list of links to fetch.
- `brave_local_search` and `brave_place_search` — businesses and points of interest near a place or a pair of coordinates.
- `brave_summarizer` — an AI summary of a web search that was run with `summary: true`.

This is Brave's maintained server. The older `@modelcontextprotocol/server-brave-search` is archived and deprecated on npm, and nobody patches it; do not install that one.

## What it can reach

Sends the agent's search queries, and any location it passes, to the Brave Search API, billed to the key; it only reads search results and changes nothing.

## Secrets it needs

- `BRAVE_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

Keys come from the Brave Search API dashboard after signing up at brave.com/search/api. Brave bills per request, $5 per 1,000 searches, with $5 of free credit each month; signing up needs a card even for the free credit (read on brave.com/search/api on 2026-09-25).

## Install

**claude-code**

```bash
claude mcp add-json brave-search '{"command":"npx","args":["-y","@brave/brave-search-mcp-server@2.1.4"],"env":{"BRAVE_API_KEY":"${BRAVE_API_KEY}"}}'
```

**codex**

```bash
codex mcp add brave-search --env "BRAVE_API_KEY=${BRAVE_API_KEY}" -- npx -y @brave/brave-search-mcp-server@2.1.4
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["BRAVE_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add brave-search -e 'BRAVE_API_KEY=${BRAVE_API_KEY}' npx -y @brave/brave-search-mcp-server@2.1.4
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Claude Code and Gemini CLI store `${BRAVE_API_KEY}` and expand it when the server starts, which is why the Gemini CLI value is in single quotes. Codex CLI is the exception: see the note under its command. Upstream also accepts `BRAVE_API_KEY_FILE`, a path to a file holding the key, if you would rather keep it out of the configuration.

Upstream documents Claude Desktop and VS Code configuration with the unpinned package; the commands above pin it and use the default stdio transport.

## Before you install it

**Queries leave the machine.** Every query goes to `api.search.brave.com`, so do not search for anything you would not type into a public search engine — a customer's name, an internal hostname, a secret pasted from a log. The server talks to nothing else and has no telemetry.

**Location.** `brave_place_search` takes coordinates or a place name, and `brave_llm_context` accepts the caller's latitude, longitude, city and postal code as headers. The agent only sends them if it is given them; if you tell it where you are, Brave receives that too.

**Narrowing the tools.** `BRAVE_MCP_ENABLED_TOOLS` (a space-separated allow-list) or `BRAVE_MCP_DISABLED_TOOLS` limits what is registered, if the agent only needs web search. Upstream notes that full local search and extra snippets need a Pro plan, and that local search falls back to web search without one.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
