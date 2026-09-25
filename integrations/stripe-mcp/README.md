# Stripe MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else runs and maintains.
> The upstream is [stripe/ai](https://github.com/stripe/ai), which points at
> the server Stripe hosts at `https://mcp.stripe.com`; the documentation is
> [docs.stripe.com/mcp](https://docs.stripe.com/mcp).
> **A hosted server cannot be pinned.** It has no version, so this recipe
> records it as `hosted`: Stripe can change the tools behind it at any time.
> What is written here was verified on 2026-09-24.
> **This server can move money. Review the permissions below before installing.**

## What it does

Stripe's official remote MCP server. The agent can look up API methods and their parameters, search Stripe's documentation, and call the Stripe API itself — read with any `GET` method, write with `POST`, `PATCH`, `PUT` and `DELETE` — against the account it is authorised for. Stripe hosts it, so there is nothing to run locally.

## What it can reach

Reads and writes the Stripe accounts and sandboxes you authorise through any Stripe API method, so it moves money: refunds, invoices, subscriptions. Stripe asks a human to confirm refunds and outbound payments.

## Secrets it needs

None in the install command. The default is **OAuth**: the first time the agent
connects, Stripe's consent page opens and you choose which accounts and
sandboxes to grant, with separate permissions for each. Complete that flow in
your agent — `/mcp` in Claude Code, `codex mcp login stripe` in Codex,
`/mcp auth stripe` in Gemini CLI. **The agent never signs in for you.**

For clients that cannot use OAuth, Stripe accepts an **Agent API key** as a
Bearer token. Create it in the Stripe Dashboard yourself, with only the
permissions the work needs, keep it in an environment variable, and reference
the variable — Stripe's own examples do exactly that, and so should you.

**From 2026-10-31, Stripe MCP no longer accepts full-access secret keys or
restricted keys without the Agent tag.** A request with one of those gets a
`401` with an OAuth discovery challenge. Do not set this up with a secret key;
use OAuth or an Agent key from the start.

## Install

**claude-code**

```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

**codex**

```bash
codex mcp add stripe --url https://mcp.stripe.com
```

**gemini-cli**

```bash
gemini mcp add --transport http stripe https://mcp.stripe.com
```

The Claude Code and Codex commands are the ones Stripe documents. Stripe does
not document a Gemini CLI command; the one above is Gemini CLI's own documented
form for a remote HTTP server, and the Gemini extension manifest in
`stripe/ai` configures the same URL with OAuth enabled.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**Start in a sandbox.** On Stripe's consent page, grant a sandbox and not a
live-mode account until you have watched what the agent does with it. If you
use a key, make it a restricted Agent key created in the sandbox, and test there
before anything touches live mode. Stripe's own advice is to test a new
configuration in a sandbox before retiring the old one.

There is no read-only endpoint. One tool, `stripe_api_write`, can call any
write method the authorisation allows: creating customers and prices, finalising
or voiding invoices, cancelling subscriptions, issuing refunds. Stripe requires
human confirmation before some writes — refunds and outbound payments among
them: the agent returns a URL, you review the request and approve it, and the
approval expires after 24 hours. That covers some actions, not all of them, so
also keep your agent's own per-tool approval prompts on for `stripe_api_write`.

Stripe warns about prompt injection when this server runs next to others: a web
page or a document another tool fetched can carry instructions, and here those
instructions can reach money. Administrators can turn MCP access off for the
whole team, separately for live mode and sandboxes, and every authorised client
appears as an OAuth session that can be revoked from the Dashboard.

## Updating

There is no pin to move: the server is whatever Stripe runs today. Re-read
[docs.stripe.com/mcp](https://docs.stripe.com/mcp) — in particular the
authentication section, which carries the 2026-10-31 key change — and change
`verified_on` and the install commands together in one pull request.
