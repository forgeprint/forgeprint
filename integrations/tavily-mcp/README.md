# Tavily MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp),
> pinned at `0.2.22` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Tavily's own server for its search API, which is built for agents: results come back as cleaned content with relevance scores rather than a page of links. Five tools:

- `tavily_search` — web search, with optional images and raw page content.
- `tavily_extract` — the content of the URLs given, as Markdown or text.
- `tavily_map` — the structure of a site, as a list of URLs.
- `tavily_crawl` — pages under a site, following links from a starting URL.
- `tavily_research` — a multi-source research job that returns a written report.

## What it can reach

Sends the agent's queries and URLs to the Tavily API, which searches, fetches and crawls pages and runs research jobs billed to the key's credits; it changes nothing.

## Secrets it needs

- `TAVILY_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

Keys come from the Tavily dashboard after signing up at tavily.com. Tavily bills in credits: 1,000 free a month with no card, then pay-as-you-go or monthly plans (read on tavily.com/pricing on 2026-09-25). Crawl and research use more credits per call than a search.

## Install

**claude-code**

```bash
claude mcp add-json tavily '{"command":"npx","args":["-y","tavily-mcp@0.2.22"],"env":{"TAVILY_API_KEY":"${TAVILY_API_KEY}"}}'
```

**codex**

```bash
codex mcp add tavily --env "TAVILY_API_KEY=${TAVILY_API_KEY}" -- npx -y tavily-mcp@0.2.22
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["TAVILY_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add tavily -e 'TAVILY_API_KEY=${TAVILY_API_KEY}' npx -y tavily-mcp@0.2.22
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Claude Code and Gemini CLI store `${TAVILY_API_KEY}` and expand it when the server starts, which is why the Gemini CLI value is in single quotes. Codex CLI is the exception: see the note under its command.

**The hosted server.** Tavily documents its hosted server first: `claude mcp add --transport http tavily https://mcp.tavily.com/mcp`, which signs in with OAuth, or the same URL with the key in a `tavilyApiKey` query parameter. A hosted endpoint cannot be pinned, which is why this recipe uses the package (`npx -y tavily-mcp@latest` upstream, pinned here). If you use the hosted one, prefer OAuth: a key in a URL ends up in configuration files, logs and shell history.

## Before you install it

**Queries and URLs leave the machine.** Everything the agent searches for, and every URL it asks Tavily to extract, map or crawl, goes to `api.tavily.com`, and Tavily's servers fetch the pages. It cannot reach `localhost` or a private network, and it should not be pointed at pages that need your login. Each request also carries a random ID for the server session.

**A missing key does not fail.** Without `TAVILY_API_KEY` the server starts in a keyless mode that still sends searches and extractions to Tavily, and refuses the other tools. If searches work but crawl says a key is required, the variable did not reach the server.

**It reads a `.env` file.** At start-up the server loads `.env` from the directory it runs in — usually the project — into its own environment. It only uses `TAVILY_API_KEY`, `TAVILY_HUMAN_ID` and `DEFAULT_PARAMETERS` from it, but a `TAVILY_API_KEY` there takes effect even though the command did not pass it.

**Cost per call varies.** `tavily_crawl` can follow many links in one call, and `tavily_research` runs many searches; both draw more credits than a single search. Set a limit on the Tavily account if the agent runs unattended.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
