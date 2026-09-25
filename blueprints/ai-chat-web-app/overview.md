# AI Chat Web App

A Next.js chat application with one streaming route on the AI SDK 7, input
bounded before the model is called, the key and the system prompt kept on the
server, and tests that drive both the route and the UI against a mock model.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real application on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `POST /api/chat`, streaming a reply as AI SDK UI message chunks, with
  `useChat` from `@ai-sdk/react` rendering it token by token.
- One provider, Anthropic through `@ai-sdk/anthropic`, named in exactly one
  file. The model id is a constant there.
- Limits enforced on the server before any model call: 20 messages per
  request, 4,000 characters per user message, 12,000 per assistant message
  sent back as history, 256 KB per body (counted while reading), 2,048 output
  tokens and a 60-second reply timeout. A closed tab aborts the generation.
- A request schema that is an allow-list: only user and assistant text. A
  client-supplied system message is refused.
- A missing key answered with 503 and a sentence, not a crash and not a
  failed stream.
- Provider errors logged on the server and replaced with a fixed sentence in
  the browser.
- Tests with `MockLanguageModelV4` from `ai/test`: a streamed reply renders in
  the UI and a second turn is accepted; an over-long message is refused and
  the refusal is shown; too many messages, a system message, an oversized
  body and a non-JSON body are refused without building a model; a missing
  key gives the 503; a provider failure does not leak its message.
- A build check that fails if the key's value, its variable name or the
  system prompt appears anywhere under `.next/static`.
- A CI workflow that runs the tests, the build and the bundle check with
  actions pinned by commit.

## Options

None. One provider keeps the recipe testable end to end without a key; a
second provider would be a different package and a different key name, and
the file where that change goes is documented in `AGENTS.md`.

## Why `project_type: agent`

The taxonomy has no type for an LLM application that is not an agent, and its
`agent` entry reads "AI agent or MCP server". This is neither in the strict
sense — the model has no tools — but `agent` is still the closer fit: it is
what somebody asking for an "AI app" is matched against, and it is what routes
the review to the OWASP Top 10 for LLM Applications rather than only to the
web references. `web` would have matched on the framework and missed what the
project is for.

## What it fits

- A chat front end for one model, where the value is in the prompt and the
  product around it rather than in tools.
- A team that wants the key, the prompt and the limits on the server from the
  first commit, with tests that prove it rather than a comment that says so.
- A project whose CI has no model key — forks, public repositories — and
  still needs the chat path tested.
- Learning where the seams are in the AI SDK 7: what `useChat` sends, what
  the route has to accept, where a mock model plugs in.

## What it is NOT for

- **A public deployment as shipped.** There is no authentication and no rate
  limit. The per-request bounds cap what one request costs, not what a
  thousand do; cost control beyond the limits it ships is yours — an auth
  layer, a rate limiter in front of the route, and a spend limit on the
  provider account.
- **Agents or tools with side effects.** The model can only write text. Use
  `langgraph-agent` for a tool-using agent with a bounded loop, or
  `ts-mcp-server` to expose tools to somebody else's agent.
- **Saved conversations.** Nothing is persisted; the browser holds the
  history and loses it on reload. Persistence means users and a retention
  decision; `nextjs-fullstack-app` has the database half of that.
- **Retrieval over your documents.** No embeddings, no vector store, no
  citations.
- **Several providers at once, or letting users pick a model.** One provider,
  one model id, in one file.
- **A page without JavaScript.** The chat is a client component.

## Pros

- **The key cannot drift into the browser unnoticed.** A test refuses a
  client file importing from `src/server/`, and a build check greps the
  shipped bundle for the key's value, its name and the system prompt.
- **A refused request costs nothing.** Every check runs before the model is
  built, and the tests assert the model factory was never called.
- **The body is bounded while it is read**, not after it has been buffered.
- **The whole chat path is tested without a key**: hook, transport, route,
  stream and render, against a mock model, in about two seconds.
- **The second turn is tested**, which is where a schema that is too strict
  for what `useChat` actually sends would first break.
- **No hidden fallback.** No key means 503 with a sentence naming the
  variable; there is no default provider or gateway behind it.

## Cons

- **Nobody has run this against a real model.** See the notice above. The
  mock proves the plumbing, not the replies.
- **No authentication and no rate limit** — the big one, and the reason the
  README says so before anything else.
- **The history is client-supplied**, including the assistant's side. A user
  can rewrite their own conversation; the schema bounds it but cannot verify
  it. That is inherent to a stateless route and harmless while the model has
  no tools and no data, and it stops being harmless the day it gets either.
- **The limits are characters, not tokens.** Cheap to check and predictable,
  but a message of unusual characters costs more tokens than its length
  suggests.
- **AI SDK majors move about twice a year**, and the hook, the transport and
  the mock model's interface have each changed across majors. Expect to
  revisit `chat.ts` and `mock-model.ts` on the next one.
- **No Content Security Policy.** The app sets `nosniff`, a referrer policy
  and `X-Frame-Options`; a CSP with nonces is a Next.js project of its own.

## Compared with the alternatives here

- **`nextjs-fullstack-app`** — the same framework with Postgres and no model.
  Start there if the product is pages over data and the chat is a feature to
  add later.
- **`langgraph-agent`** — Python, a tool-using agent, no UI. The one to read
  for how a tool boundary is designed and tested.
- **`ts-mcp-server`** — TypeScript tools for somebody else's agent, rather
  than a chat of your own.

## Cost of adoption

About five minutes on a machine with Node.js 22.12 or newer: one `npm install`
of roughly 130 packages, a test run and a build. A real reply needs an
Anthropic API key, which is a paid account the recipe never asks for.
