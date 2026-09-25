# AI Chat Web App — agent context

A Next.js App Router chat with one streaming route on the AI SDK 7. Read this
before changing the route, adding a provider, or giving the model anything to
do.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/lib/limits.ts            every bound the route enforces; safe to import anywhere
src/server/model.ts          the only file that names a provider, a model or the key
src/server/system-prompt.ts  the system prompt, server-side only
src/server/chat.ts           handleChat(request, getModel): checks, then streamText
src/app/api/chat/route.ts    POST, a thin call into handleChat with the real model
src/components/chat.tsx      'use client', useChat from @ai-sdk/react
tests/                       vitest; the route and the UI against MockLanguageModelV4
scripts/check-client-bundle.ts  fails if the key or the prompt reached .next/static
```

## Rules that are not style preferences

**Nothing under `src/server/` is imported by a `'use client'` file.** A client
component that imports from there puts the provider, the key's name and the
system prompt into the browser bundle, and the type checker does not object.
`tests/boundaries.test.ts` refuses the import; `npm run check:bundle` refuses
the result. Shared constants go in `src/lib/`.

**The key is read in `src/server/model.ts` and nowhere else.** Never prefix it
`NEXT_PUBLIC_` — that prefix exists to inline a value into client JavaScript.
A missing key is `MissingApiKeyError`, which the route turns into a 503 with a
sentence. There is no fallback key and no default provider behind it; do not
add one, because a silent fallback is how a staging deployment ends up billing
somebody else's account.

**The model is a parameter of `handleChat`.** The route passes `chatModel`;
tests pass a `MockLanguageModelV4` from `ai/test`. Keep it that way: a module
that builds its own client from the environment can only be tested with a
real key, which means CI stops testing it.

**Every check runs before the model is built.** Content type, body size,
schema, message count and length — in that order, all in `handleChat`. A
refused request must cost nothing, and the tests assert the model factory was
never called.

**The request schema is an allow-list.** Only `user` and `assistant` roles,
only `text` and `step-start` parts. A `system` message from the client is a
400, not something to filter. If you add a part type (files, images), add it
to the schema deliberately and add a limit for it in `limits.ts`.

**The system prompt is not a security control.** Assume a user can get the
model to repeat it. Never put a key, an internal URL, or a rule you rely on
for authorization in `system-prompt.ts` (OWASP LLM 2025, system prompt
leakage).

**Provider errors stay on the server.** `toUIMessageStreamResponse({ onError })`
logs the error and returns a fixed sentence. The provider's own message can
name the account's limits or echo the request; it does not go to the browser.

**Model output is rendered as text.** `chat.tsx` renders `part.text` inside a
`<p>`. If you add Markdown rendering, use a renderer that does not pass raw
HTML through, because model output is attacker-influenced input to the page.

## Commands

```
npm test                         vitest, no key needed
npm run dev                      needs ANTHROPIC_API_KEY in .env.local for a real reply
ANTHROPIC_API_KEY=local-development-only-not-a-real-secret npm run build
ANTHROPIC_API_KEY=local-development-only-not-a-real-secret npm run check:bundle
```

`next build` also type-checks. `npm run typecheck` works after a build, when
`next-env.d.ts` exists.

## When you are asked to...

**...switch provider or model.** Change `src/server/model.ts` and the package
it imports, and the key's name in `boundaries.test.ts`, `check-client-bundle.ts`
and the README. Nothing else should need to change; if something does, a
provider detail has leaked out of that file.

**...add a tool.** Stop and say what it will be able to do. This blueprint
has no tools on purpose: with none, a prompt injection can only change the
text of a reply. A tool that reads data makes injection a disclosure path; a
tool that writes, sends or spends makes it an action (OWASP LLM 2025,
excessive agency). The first tool needs a narrow argument, a check in code
rather than in the prompt, a test that tries to misuse it, and — if it has a
side effect — a human approval step. Tool results are untrusted input too.

**...keep chat history.** There is no database; the browser holds the
conversation and sends it with every request. Persisting it means users,
authentication and a retention decision, which is a different blueprint.

**...raise a limit.** Change `src/lib/limits.ts` only, and remember what it
buys: every request replays the history, so the history bound and the output
bound together are the per-request cost ceiling.

**...deploy it publicly.** It has no authentication and no rate limit, so
anybody who finds the route spends the key's money, one bounded request at a
time. Add authentication, put a rate limit in front of the route, and set a
spend limit on the provider account before it is reachable from the internet.
