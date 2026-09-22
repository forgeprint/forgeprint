# Privacy

Short version: **the MCP server collects nothing.** No telemetry, no logs of
what you asked, no identifiers, no analytics. This document exists so that is
verifiable rather than asserted.

## What `forgeprint-mcp` does

It runs on your machine, started by your agent. It answers tool calls with
text, and it does two things over the network, both of them reads:

| Request                                              | When                                     | What it sends                  |
| ---------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| `GET` the catalog index from GitHub Pages            | first call, then cached for five minutes | nothing but the request itself |
| `GET` blueprint files from raw.githubusercontent.com | when a blueprint is fetched              | the same                       |

No request carries your profile, your goal, your project, your paths or any
identifier. The resolver runs **locally**: the matching, the scoring and the
questions all happen in the process on your machine, against a catalog it
downloaded. Nothing about what you are building leaves your computer.

GitHub sees what any download looks like — an IP address and a user agent —
because the files are served from GitHub. That is between you and GitHub, and
it is the same whether you fetch the catalog through this server or open the
site in a browser.

With `FORGEPRINT_CATALOG` pointing at a local checkout, there is no network
traffic at all.

## What it does not do

- **No telemetry.** Nothing is sent anywhere about which blueprint was
  resolved, what was asked, or that the server ran.
- **No logs.** The server writes nothing to disk. Under the stdio transport it
  may not even write to stdout — that channel carries the protocol.
- **No identifiers.** No installation id, no machine id, no session id.
- **No execution.** It runs no commands on your machine and returns text only
  (rule 21). What your agent then does with that text is your agent's
  behaviour, not this server's.

## The site

https://forgeprint.github.io/forgeprint is static files served by GitHub Pages.
No analytics, no cookies, no fonts or scripts loaded from anywhere else.

One page makes one request in your browser: the front page reads the open
`blueprint-request` issues from the public GitHub API, with no token, so the
request queue is current rather than a snapshot
([ADR 0007](docs/decisions/0007-live-requests-no-write-token.md)). The result
is cached in your tab's `sessionStorage` for ten minutes and is not sent
anywhere. If the request fails, the page shows the dated snapshot it shipped
with.

## If a counter is ever added

The roadmap mentions a "times resolved" counter for blueprint pages. It does
not exist, and if it is ever built these are the terms, written here first so
that they are a commitment rather than a design note:

- **Opt-in.** Off unless the user turns it on, and never on by default.
- **Anonymous.** A count per blueprint. No identifier, no profile, no goal, no
  IP retained.
- **Announced.** It ships in a release whose CHANGELOG says so plainly, and
  this document is updated in the same commit.

Anything that cannot be built under those terms does not get built.

## Checking this yourself

The server is a few hundred lines of TypeScript under `packages/mcp-server`,
and the network access is in one file, `src/catalog.ts`. The two environment
variables that decide where it reads from are documented in
[docs/mcp.md](docs/mcp.md). Reading it is faster than trusting this page.

## Questions

Open an issue. For anything security-related, see [SECURITY.md](SECURITY.md).
