# Changelog

## 1.0.0 — 2026-09-24

First recipe for Stripe MCP, recorded as `hosted`.

- Drafted from the 2026-09-24 research and verified live on 2026-09-24 against
  https://docs.stripe.com/mcp and https://github.com/stripe/ai. The endpoint,
  the authentication methods, the Claude Code and Codex commands, the key
  change and the human-confirmation rule were read from those pages rather
  than recalled, and the endpoint answered with an OAuth challenge.
- The server is hosted, so `upstream_version` is `hosted`. The README says
  plainly that Stripe can change it at any time.
- OAuth is the default, so no secret is declared. The Agent API key
  alternative is documented with no value in any command, together with
  Stripe's refusal of full-access and non-Agent keys from 2026-10-31.
- The permissions summary says it moves money. The README recommends a
  sandbox and a restricted Agent key, and describes the confirmation Stripe
  asks for before refunds and outbound payments.
