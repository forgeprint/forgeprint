# Firecrawl MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server),
> pinned at `3.25.4` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Firecrawl's own server. Firecrawl renders pages in its own browsers and returns them clean, so the agent gets Markdown or JSON instead of raw HTML, including from pages that need JavaScript. The everyday tools:

- `firecrawl_scrape` — one URL as Markdown, or as JSON matching a schema.
- `firecrawl_search` — web search, optionally with the result pages' content.
- `firecrawl_map` — the URLs on a site, without their content.
- `firecrawl_crawl` and `firecrawl_check_crawl_status` — many pages under a site.

It registers more than twenty others, and several of them do more than read — see below.

## What it can reach

Sends URLs and queries to Firecrawl, which fetches pages, clicks and types in them and runs research jobs, billed to the key's credits; it can also create recurring monitors that post to a webhook.

## Secrets it needs

- `FIRECRAWL_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

Keys are created at firecrawl.dev under the account's API keys. Firecrawl bills in credits: a free plan with 1,000 credits a month, then paid plans (read on firecrawl.dev/pricing on 2026-09-25). A scrape costs one credit a page, a search two per ten results, and browser interaction two per minute.

## Install

**claude-code**

```bash
claude mcp add-json firecrawl '{"command":"npx","args":["-y","firecrawl-mcp@3.25.4"],"env":{"FIRECRAWL_API_KEY":"${FIRECRAWL_API_KEY}"}}'
```

**codex**

```bash
codex mcp add firecrawl --env "FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}" -- npx -y firecrawl-mcp@3.25.4
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["FIRECRAWL_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add firecrawl -e 'FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}' npx -y firecrawl-mcp@3.25.4
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Claude Code and Gemini CLI store `${FIRECRAWL_API_KEY}` and expand it when the server starts, which is why the Gemini CLI value is in single quotes. Codex CLI is the exception: see the note under its command.

Upstream documents only the generic `env FIRECRAWL_API_KEY=… npx -y firecrawl-mcp`, unpinned; the commands above pin it. Firecrawl also hosts the server at `https://mcp.firecrawl.dev/v2/mcp`, with a keyless, rate-limited tier that offers only scrape, search and parse. A hosted endpoint cannot be pinned, which is why this recipe uses the package; the requests go to Firecrawl either way.

## Before you install it

**Everything goes through Firecrawl.** Every URL, search query and extraction prompt the agent uses is sent to Firecrawl's API (`api.firecrawl.dev`), and the pages are fetched by Firecrawl's browsers, not yours. That means it cannot reach `localhost` or your private network — but anything the agent puts in a URL or a query, including a token in a query string, is now in Firecrawl's logs. Do not point it at pages that need your login.

**It does more than read.** Beyond scraping, the server registers tools that act:

- `firecrawl_interact` clicks, types and navigates in a page from Firecrawl's browser, following a prompt or running code the agent writes. On a form, that is a submission from Firecrawl's address on the agent's say-so.
- `firecrawl_monitor_create` and `firecrawl_monitor_update` create recurring monitors (every 30 minutes by default) that keep spending credits after the session ends and can post each change to any webhook URL or email address. `firecrawl_monitor_delete` removes one.
- `firecrawl_agent` runs an autonomous research job across many sites, and `firecrawl_crawl` can fetch thousands of pages; both can use a lot of credits in one call.
- `firecrawl_scrape` with an `alexandria` argument runs paid third-party data providers from Firecrawl's catalogue, on teams with access. Some providers require accepting their terms, which upstream itself calls a legal act.

The server has no switch to leave these out. Deny them in the agent instead: in Claude Code, add `mcp__firecrawl__firecrawl_interact`, `mcp__firecrawl__firecrawl_monitor_create`, `mcp__firecrawl__firecrawl_monitor_update`, `mcp__firecrawl__firecrawl_monitor_delete` and `mcp__firecrawl__firecrawl_agent` to `permissions.deny`; in Gemini CLI, `gemini mcp add` takes `--exclude-tools`. Set a monthly spend limit on the Firecrawl account as well.

**Feedback tools.** `firecrawl_search_feedback` and `firecrawl_feedback` let the agent send Firecrawl feedback on results (search feedback refunds a credit). Set `FIRECRAWL_NO_SEARCH_FEEDBACK=1` and `FIRECRAWL_NO_ENDPOINT_FEEDBACK=1` to leave them out. There is no other telemetry in the local server.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
