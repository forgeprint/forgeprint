# Catalog candidates

What the catalog should hold next, and why. Produced with
[`catalog-research`](../skills/catalog-research/SKILL.md) from
[the demand report of 2026-09-23](research/2026-09-23-demand.md).

**These are candidates, not commitments.** Nothing here is written until the
core maintainer picks it, and a candidate nobody picks was correctly identified
as not urgent. No draft exists for any of them.

---

## What the catalog covers today

Five blueprints, and their triples — this is what rule 9 is checked against:

| Slug                          | `stack`                    | `project_type` | `requirements`                           |
| ----------------------------- | -------------------------- | -------------- | ---------------------------------------- |
| `dotnet-web-api`              | dotnet, aspnetcore, efcore | `api`          | auth, ci, containerization               |
| `dotnet-multitenant-saas-api` | dotnet, aspnetcore, efcore | `api`          | auth, ci, containerization, multi-tenant |
| `fastapi-service`             | fastapi, postgres          | `api`          | auth, ci, containerization               |
| `ts-mcp-server`               | node, mcp                  | `agent`        | ci, testing                              |
| `dotnet-mcp-server`           | dotnet, mcp                | `agent`        | ci, testing                              |

Two `project_type` values out of nine. Three languages out of nineteen. Eleven
of the fifteen strongest stack combinations in the demand report have nothing
behind them, and `mobile`, `cli`, `game`, `infra`, `lib` and `web` all return
`no_match`.

**Nobody has asked us yet.** Zero open `blueprint-request` issues. Every
candidate below is therefore an outside signal, which is the weaker kind — one
person asking would outrank all five.

---

## The five

### 1. `python-mcp-server`

The clearest gap. The catalog has an MCP server blueprint in TypeScript and one
in C#, and Python's SDK is downloaded at a comparable scale to TypeScript's.

- **Triple:** stack `[mcp]` · `agent` · `[ci, testing]` — new: the two existing
  agent blueprints carry `node` and `dotnet` alongside `mcp`.
- **Demand:** `mcp` on PyPI, 219.5M downloads in the last month (2026-09-23).
- **Options:** `transport: [stdio, http]` — the same split the other two use,
  which keeps the three comparable.
- **`provides.mcp`:** `everything` (the reference server is the conformance
  target a server blueprint is checked against), `filesystem`.
- **Testable:** the same proof the other two now carry — start the server,
  speak the protocol to it, and for `http` show that a foreign `Origin` is
  refused with 403. Not "it starts".
- **Risk, and it is a real one:** the taxonomy has no plain `python` value in
  `stack`, so the stack would be `[mcp]` alone, which is thinner than the other
  two and makes the resolver lean entirely on `languages`. **This needs a
  taxonomy pull request first** — that is two changes, and the vocabulary one
  goes on its own.

### 2. `nextjs-fullstack-app`

The strongest combined signal in the report, and `web` is empty.

- **Triple:** stack `[nextjs, react, tailwind, postgres]` · `web` ·
  `[auth, ci, testing]` — new by every part.
- **Demand:** `next` 42.7M/wk, `tailwindcss` 95.6M/wk, `drizzle-orm` 16.3M/wk,
  `prisma` 12.2M/wk (npm, week of 2026-09-15). Next.js 142k stars.
- **Options:** `orm: [drizzle, prisma]` — the one place the ecosystem is
  genuinely split, and the report shows Drizzle ahead on installs while Prisma
  7 rewrote its client.
- **`provides.mcp`:** `playwright` (5.43M/wk — the browser is the point of a
  `web` blueprint), `chrome-devtools` (1.03M/wk).
- **Testable:** build, run migrations against a Postgres service container,
  and a Playwright test that signs in and reads a row back. That is a test of
  what the blueprint claims, not of the compiler.
- **Risk:** the longest recipe the catalog would carry, and Next.js is gaining
  usage while losing satisfaction (State of JS 2025). A reader who resents the
  framework will resent the blueprint. Also the only candidate where the option
  field changes a large part of the recipe.

### 3. `go-http-service`

A fourth `api`, which needs justifying — the justification is that `languages`
is the heaviest criterion in the resolver and Go returns `no_match` today.

- **Triple:** stack `[gin, postgres, docker]` · `api` ·
  `[auth, ci, containerization]` — the type and requirements match
  `dotnet-web-api` and `fastapi-service`; the stack does not, so rule 9 is
  satisfied.
- **Demand:** Go among the languages with the highest perceived growth
  (JetBrains 2025); `gin` is in the taxonomy and in no blueprint.
- **Options:** `database: [postgres, sqlite]`, `router: [gin, net/http]` —
  `net/http` is not in the taxonomy's stack list, so this may be one option
  field, not two.
- **`provides.mcp`:** `github` (33.1k stars, and this blueprint sets up `ci`),
  `sentry` where the reader adds observability.
- **Testable:** `go test ./...`, a container that answers `/health`, and a
  request without a token that is refused. Go's toolchain is on every runner
  and the build is fast, so this is the cheapest of the five in CI.
- **Risk:** the third `auth + ci + containerization` API. If the resolver ever
  weights language lower, three near-identical blueprints look like a catalog
  that repeats itself.

### 4. `astro-content-site`

The other `web` candidate, and the opposite shape from `nextjs-fullstack-app`:
no database, no auth, short recipe.

- **Triple:** stack `[astro, tailwind]` · `web` · `[seo, ci, accessibility]` —
  new, and it is the only candidate that would put `seo` and `accessibility`
  into the catalog at all.
- **Demand:** Astro leads meta-framework satisfaction by about 39 points over
  Next.js (State of JS 2025).
- **Options:** `content: [markdown, mdx]`, `deploy: [static, cloudflare]`.
- **`provides.mcp`:** `playwright` (an accessibility assertion needs a
  browser), `context7` (354k/wk).
- **Testable:** build, then assert the generated HTML actually carries the meta
  tags and heading structure the blueprint claims. A `seo` blueprint whose test
  is "it built" would be exactly the kind of verification the catalog rejects.
- **Risk:** the smallest blueprint here, and a reader may reasonably ask what
  it adds over `npm create astro`. The answer has to be the SEO and
  accessibility work, or there is no blueprint.

### 5. `python-background-worker`

Fills `data`, and `background-jobs` — a requirement in the taxonomy that no
blueprint has ever carried.

- **Triple:** stack `[redis, postgres, docker]` · `data` ·
  `[background-jobs, ci, containerization]` — new by every part.
- **Demand:** `celery` 42.0M downloads in the last month (PyPI, 2026-09-23).
- **Options:** `broker: [redis, rabbitmq]` — `rabbitmq` is not in the
  taxonomy, so this may have to be `[redis]` only, which is not an option field
  at all (a field needs at least two values).
- **`provides.mcp`:** `sentry` (a worker that fails silently is the failure
  mode this blueprint exists to prevent), `postgres`.
- **Testable:** enqueue a job, wait for the result, and assert a retry happens
  when the job raises. That is the only way to prove a queue works.
- **Risk:** two taxonomy gaps (`celery`, `rabbitmq`), and the recipe needs two
  service containers plus a worker process, which is the most fragile CI setup
  of the five.

---

## Not proposed, with the reason

- **`mobile` (React Native / Expo).** The emptiest `project_type` and a real
  gap, but a mobile build in CI needs either a paid build service or an
  account-bound toolchain, and the catalog's first filter is that the recipe
  runs on an ordinary Linux runner. A blueprint whose setup cannot be tested is
  a description. If this is ever wanted, it has to be scoped to what does run
  headless — `expo export` and the test suite — and say plainly that it does
  not build an app store binary.
- **`game`.** Unity and Godot are in the taxonomy; neither has a CI story that
  does not involve a licence server or a multi-gigabyte editor download.
- **A second FastAPI blueprint.** Anything close enough to be tempting is an
  option on `fastapi-service`, not a blueprint (rule 8, ADR 0001).

---

## Before any of these is written

1. **The core maintainer picks.** No draft exists and none will be produced
   before that (CLAUDE.md §10, "Never invent a blueprint on your own").
2. **Taxonomy first where one is needed.** Candidates 1 and 5 need vocabulary
   that does not exist. The taxonomy change is its own pull request and it goes
   first.
3. **Provenance is declared up front.** A generated draft carries
   `provenance: generated` and can never be `tier: official`
   ([ADR 0011](decisions/0011-generated-blueprints.md)). A draft derived from
   an existing project also records `derived_from`
   ([ADR 0008](decisions/0008-provenance.md)).
