# Perplexity MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [perplexityai/modelcontextprotocol](https://github.com/perplexityai/modelcontextprotocol),
> pinned at `1.2.1` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Perplexity's own server for its API platform. Four tools, one search and three that ask Perplexity's models to answer from the web:

- `perplexity_search` — ranked web results with metadata, with recency and domain filters.
- `perplexity_ask` — a quick answer with web search, on the Agent API's `fast` preset.
- `perplexity_reason` — a longer, reasoned answer, on the `medium` preset.
- `perplexity_research` — a deep research report, on the `high` preset; a run can take minutes.

The three answer tools hand the question to another model. What comes back is Perplexity's answer, with its sources, not raw pages.

## What it can reach

Sends the agent's questions and search queries to the Perplexity API, which searches the web and answers with its models, billed per request and per token to the key's account; it changes nothing.

## Secrets it needs

- `PERPLEXITY_API_KEY` — create it at the upstream, give it the narrowest scope that works,
  and put it in your environment. **The agent never enters it for you.**

Keys come from the Perplexity API console (console.perplexity.ai). Every call is billed: the Search API at $5 per 1,000 requests, and the answer tools by the model tokens and the searches and page fetches the preset makes along the way (read on docs.perplexity.ai on 2026-09-25). `perplexity_research` makes many of those in one call.

## Install

**claude-code**

```bash
claude mcp add-json perplexity '{"command":"npx","args":["-y","@perplexity-ai/mcp-server@1.2.1"],"env":{"PERPLEXITY_API_KEY":"${PERPLEXITY_API_KEY}"}}'
```

**codex**

```bash
codex mcp add perplexity --env "PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}" -- npx -y @perplexity-ai/mcp-server@1.2.1
```

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`. To keep only its name there,
add the server by hand with `env_vars = ["PERPLEXITY_API_KEY"]` instead of
`env`: Codex then forwards the variable from your environment when it starts
the server.

**gemini-cli**

```bash
gemini mcp add perplexity -e 'PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}' npx -y @perplexity-ai/mcp-server@1.2.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Claude Code and Gemini CLI store `${PERPLEXITY_API_KEY}` and expand it when the server starts, which is why the Gemini CLI value is in single quotes. Codex CLI is the exception: see the note under its command.

Upstream documents `claude mcp add perplexity --env PERPLEXITY_API_KEY=… -- npx -y @perplexity-ai/mcp-server` and the same shape for Codex, both unpinned and with the key typed into the command; the commands above pin the package and reference the variable instead. If a client fails to start the server because `npx` prints to stdout, upstream suggests `npx -yq`.

**The hosted server.** Perplexity also hosts the same tools at `https://api.perplexity.ai/mcp`, authenticated with the same key as a bearer header, and documents it first. A hosted endpoint cannot be pinned, which is why this recipe uses the package; the questions go to Perplexity's API either way.

## Before you install it

**Every question leaves the machine and costs money.** Whatever the agent asks — including code, error messages or file contents it pastes into a question — is sent to `api.perplexity.ai` and processed by Perplexity's models. Keep secrets, customer data and anything under a confidentiality agreement out of it. Set a spend limit on the Perplexity account if the agent runs unattended, since `perplexity_research` in a loop adds up quickly.

**Answers are a model's answers.** The answer tools return text another model wrote from its own searches. Check the cited sources before relying on one.

**Nothing else.** The server calls only the Perplexity API (or the base URL you set with `PERPLEXITY_BASE_URL`), honours `PERPLEXITY_PROXY` or `HTTPS_PROXY`, and has no telemetry.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
