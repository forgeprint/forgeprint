# Fetch MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch),
> pinned at `2026.8.18` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

One tool, `fetch`: the agent names a URL, the server downloads it and returns the page as Markdown, in chunks the agent can page through with `start_index`. Useful when a coding agent has no web access of its own, or when its own stops at search results rather than the page.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed.

It is one of the MCP steering group's reference servers. Upstream describes them as reference implementations and educational examples, not production-ready solutions, and asks users to add their own safeguards for their own threat model. Read the section below with that in mind.

## What it can reach

Sends GET requests to any URL the agent asks for, following redirects, from the machine it runs on, including localhost and private network addresses.

## Install

**claude-code**

```bash
claude mcp add-json fetch '{"command":"uvx","args":["mcp-server-fetch==2026.8.18"]}'
```

**codex**

```bash
codex mcp add fetch -- uvx mcp-server-fetch==2026.8.18
```

**gemini-cli**

```bash
gemini mcp add fetch uvx mcp-server-fetch==2026.8.18
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**It can reach your internal network.** The upstream README says so itself: the server can access local and internal IP addresses and may be a security risk. Nothing in `2026.8.18` refuses `localhost`, a private range or a cloud metadata address, and redirects are followed, so a public page can send it somewhere internal. That makes it a server-side request forgery path: an instruction hidden in a page the agent read can ask it to fetch an admin panel, a development server or a cloud instance metadata endpoint, and the response comes back into the conversation. Install it only on a machine where every address it can reach is one the agent may read — not on a laptop inside a company network, and not on a cloud host that can reach an instance metadata service. If it has to run somewhere like that, pass `--proxy-url` with a proxy that refuses internal destinations.

**robots.txt is honoured for the agent, not for you.** A request the model makes through the tool checks the site's robots.txt first and stops if the site disallows it. A request made through the `fetch` prompt, which a user starts, does not check. Leave `--ignore-robots-txt` off.

**Every request says it is automated.** The default user agent names the Model Context Protocol and says whether the request was autonomous. Some sites refuse it. Changing it with `--user-agent` to pass as a browser is a decision about the site's terms, not only a setting.

On Windows, upstream suggests setting `PYTHONIOENCODING=utf-8` in the server's environment if requests time out.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
