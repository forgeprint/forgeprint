# What the catalog could hold — the full map, 2026-09-23

The [demand report](2026-09-23-demand.md) ranked the fifteen strongest stack
combinations. This is the other question: **across the whole taxonomy, what
blueprints are worth publishing at all**, and in what order.

The catalog is being bootstrapped by the maintainer rather than by contributors
for now, so this is a build plan and not a wishlist. Everything here is sized
against the one filter that kills most ideas: **the recipe has to run in CI on
an ordinary Linux runner.**

Every row carries a number and where it came from. Numbers were read on
2026-09-23 from the npm, PyPI, NuGet, crates.io and GitHub APIs; a number with
a survey behind it says which survey.

---

## Where the catalog is

Seven blueprints, two of the nine `project_type` values, three of nineteen
languages.

| `project_type` | Have                                                               | Missing                            |
| -------------- | ------------------------------------------------------------------ | ---------------------------------- |
| `api`          | `dotnet-web-api`, `dotnet-multitenant-saas-api`, `fastapi-service` | Go, TypeScript, Java, PHP, Rust    |
| `agent`        | `ts-mcp-server`, `dotnet-mcp-server`, `python-mcp-server`          | anything that is not an MCP server |
| `web`          | `astro-content-site`                                               | every application framework        |
| `cli`          | —                                                                  | all of it                          |
| `lib`          | —                                                                  | all of it                          |
| `data`         | —                                                                  | all of it                          |
| `infra`        | —                                                                  | all of it                          |
| `mobile`       | —                                                                  | blocked, see below                 |
| `game`         | —                                                                  | mostly blocked, see below          |

---

## The plan, by project type

Priority is **1** (write next), **2** (worth writing), **3** (only on demand).
"Taxonomy" marks a candidate that needs a vocabulary value that does not exist
yet — that is its own pull request and it goes first.

### `cli` — the emptiest category and the cheapest to fill

A CLI blueprint is the least expensive recipe in the catalog: no database, no
container, no service to wait for. Build, run, assert the output.

| Slug         | Stack            | Language   | Evidence                                                                   | Pri | Taxonomy       |
| ------------ | ---------------- | ---------- | -------------------------------------------------------------------------- | --- | -------------- |
| `node-cli`   | node + commander | typescript | `commander` 375.2M/wk — the most-installed package in this entire document | 1   | `commander`    |
| `python-cli` | python + typer   | python     | `typer` 239.1M/mo, `click` 783.7M/mo                                       | 1   | `typer`        |
| `go-cli`     | cobra            | go         | `spf13/cobra` 44.6k stars; kubectl, hugo, docker                           | 1   | `cobra`, `go`  |
| `rust-cli`   | clap             | rust       | `clap` 233.6M recent downloads                                             | 2   | `clap`, `rust` |

All four verify the same way and none of them can fail for environmental
reasons. If the catalog needs volume that readers can trust, this is where it
comes from.

### `lib` — the other empty category, and the one with a real gate

A library blueprint's value is not the source layout; it is **publishing
correctly**: versioning, changelog, provenance, and a release that cannot go
out half-done. The catalog has opinions about that already.

| Slug             | Stack       | Language   | Evidence                                                          | Pri | Taxonomy |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------- | --- | -------- |
| `ts-library`     | node + vite | typescript | `vitest` 73.8M/wk, `tsup` 6.2M/wk; npm provenance is now the norm | 1   | `vitest` |
| `python-package` | python      | python     | `ruff`, `pytest`; PyPI trusted publishing                         | 2   | —        |
| `dotnet-library` | dotnet      | csharp     | NuGet is the maintainer's own daily ground                        | 2   | —        |
| `rust-crate`     | —           | rust       | crates.io, `cargo publish`                                        | 3   | `rust`   |

### `data` — nothing, and the taxonomy already has a requirement for it

`background-jobs` has been in the taxonomy since the first week and no
blueprint has ever carried it.

| Slug                       | Stack                     | Language | Evidence                                                                            | Pri | Taxonomy        |
| -------------------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------- | --- | --------------- |
| `python-background-worker` | redis + postgres + docker | python   | `celery` 42.6M/mo                                                                   | 1   | `celery`        |
| `dbt-duckdb-project`       | duckdb                    | sql      | `dbt-core` 24.0M/mo; DuckDB 41.7k stars                                             | 2   | `dbt`, `duckdb` |
| `dagster-pipeline`         | postgres + docker         | python   | `dagster` 8.0M/mo; higher adoption in small orgs than Airflow ([survey][de-survey]) | 2   | `dagster`       |
| `streamlit-dashboard`      | python                    | python   | `streamlit` 19.3M/mo                                                                | 3   | `streamlit`     |

`dbt` + DuckDB is the interesting one: it runs entirely in a file, so the CI
story is trivial — which is rare for anything in `data`.

### `infra` — high value, and the hardest to verify honestly

An `infra` blueprint can be linted and planned in CI, but **applying it needs a
cloud account**, which the catalog's first filter forbids. That is not fatal;
it means the verification is `validate` + `plan` + `policy check`, and the
blueprint has to say plainly that nothing was applied.

| Slug                      | Stack                     | Language | Evidence                                                                          | Pri | Taxonomy |
| ------------------------- | ------------------------- | -------- | --------------------------------------------------------------------------------- | --- | -------- |
| `terraform-module`        | terraform                 | —        | Terraform 49.7k stars, still dominant by installed base ([comparison][iac])       | 1   | —        |
| `github-actions-workflow` | github-actions            | bash     | Every blueprint here already ships one; the catalog has opinions worth extracting | 2   | —        |
| `kubernetes-helm-chart`   | kubernetes                | —        | Kubernetes 127.9k stars                                                           | 2   | `helm`   |
| `docker-compose-stack`    | docker + postgres + redis | —        | The local-development shape almost every other blueprint assumes                  | 3   | —        |

### `api` — five languages away from being complete

The type with the most coverage and still the most obvious gaps. Each of these
is a new triple because the stack differs; rule 9 is satisfied by the stack,
and `languages` is the resolver's heaviest criterion.

| Slug              | Stack                          | Language   | Evidence                                                  | Pri | Taxonomy |
| ----------------- | ------------------------------ | ---------- | --------------------------------------------------------- | --- | -------- |
| `go-http-service` | gin + postgres + docker        | go         | `gin` 89.2k stars                                         | 1   | `go`     |
| `ts-http-service` | node + express/hono + postgres | typescript | `express` 101.5M/wk; `hono` 46.1M/wk and closing          | 1   | `hono`   |
| `spring-boot-api` | spring-boot + postgres         | java       | 81.5k stars; Java is the enterprise floor                 | 2   | `java`?  |
| `nestjs-api`      | nestjs + postgres              | typescript | `@nestjs/core` 10.3M/wk                                   | 2   | —        |
| `laravel-api`     | laravel + mysql                | php        | 85.0k stars                                               | 3   | —        |
| `axum-api`        | axum + postgres                | rust       | `axum` 118.5M recent                                      | 3   | `rust`   |
| `realtime-api`    | node + redis                   | typescript | `socket.io` 13.6M/wk; `realtime` is an unused requirement | 3   | —        |

### `web` — one blueprint, and it is the quiet one

| Slug                   | Stack                                | Language   | Evidence                                                        | Pri | Taxonomy |
| ---------------------- | ------------------------------------ | ---------- | --------------------------------------------------------------- | --- | -------- |
| `nextjs-fullstack-app` | nextjs + react + tailwind + postgres | typescript | `next` 42.7M/wk, `tailwindcss` 95.6M/wk, `drizzle-orm` 16.3M/wk | 1   | —        |
| `sveltekit-app`        | svelte + tailwind                    | typescript | `svelte` 4.2M/wk; highest retention in State of JS 2025         | 2   | —        |
| `django-web`           | django + postgres                    | python     | `django` 40.5M/mo                                               | 2   | —        |
| `nuxt-app`             | vue + tailwind                       | typescript | `vue` 12.0M/wk                                                  | 3   | `nuxt`   |
| `blazor-web`           | blazor + dotnet                      | csharp     | The maintainer's own stack; `blazor` already in the taxonomy    | 3   | —        |

### `agent` — three MCP servers, and nothing that uses a model

Everything the catalog has under `agent` builds an MCP server. Nothing builds
the thing on the other end.

| Slug              | Stack             | Language   | Evidence                                                                                             | Pri | Taxonomy     |
| ----------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------- | --- | ------------ |
| `langgraph-agent` | python            | python     | `langchain` 173.7M/mo; LangGraph the recommended start for new agent projects ([frameworks][agents]) | 1   | `langgraph`  |
| `ai-sdk-agent`    | node              | typescript | `ai` 17.9M/wk                                                                                        | 2   | `ai-sdk`     |
| `rag-service`     | python + postgres | python     | `llama-index` 3.3M/mo; pgvector is in Postgres                                                       | 2   | `llamaindex` |
| `go-mcp-server`   | go + mcp          | go         | Completes the MCP set; the Go SDK is newer                                                           | 3   | `go`         |

**A caution that belongs in every one of these.** An agent blueprint ships a
tool surface, which is the single largest security decision in this catalog
(OWASP LLM 2025, excessive agency; Agentic 2026). The MCP server blueprints get
away with an `add` tool that does nothing; an agent blueprint that reads files
or calls an API does not. These need the §5c review more than anything else
here, and none of them should be `generated`.

---

## Not proposed, and why

- **`mobile`.** React Native and Expo are the obvious candidates and a mobile
  build in CI needs either a paid build service or an account-bound toolchain.
  A blueprint whose setup cannot be executed is a description, and the catalog
  refuses those. The honest version is scoped to what runs headless —
  `expo export` and the test suite — and says plainly that it does not produce
  an app store binary. Worth doing **only** with that disclosure.
- **`game` with Unity or Unreal.** A licence server and a multi-gigabyte editor
  download. Not testable, not proposable.
- **`game` with Bevy — the exception worth knowing.** Bevy is a Rust crate
  (48.3k stars, 1.5M recent downloads); `cargo build` and `cargo test` run
  headless on an ordinary runner with no display and no licence. This is the
  only `game` blueprint that could pass the gate. Priority 3, but it is not
  blocked the way the others are, and the next person to say "games are
  impossible here" should read this line first.
- **A second blueprint for a stack the catalog already has.** Anything close
  enough to be tempting is an `options` field on the existing one (rule 8,
  ADR 0001), or a `supersedes`, or nothing.

---

## What this implies about the taxonomy

Nineteen of the candidates above need a vocabulary value that does not exist.
Grouped, because `stack` additions should land as few pull requests as
possible:

| Group          | Values                                            |
| -------------- | ------------------------------------------------- |
| Runtimes       | `go`, `rust`, `java`                              |
| CLI frameworks | `commander`, `typer`, `cobra`, `clap`             |
| Data           | `celery`, `dbt`, `duckdb`, `dagster`, `streamlit` |
| Agents         | `langgraph`, `llamaindex`, `ai-sdk`               |
| Web and infra  | `hono`, `nuxt`, `vitest`, `helm`                  |

`python` was added for `python-mcp-server` and is the precedent: a runtime
value beside `node` and `dotnet`. `go`, `rust` and `java` follow the same
shape and belong in one pull request.

A vocabulary value with no blueprint behind it is dead weight, so each group
lands with — or immediately before — the blueprint that needs it.

---

## Suggested order

Ten blueprints, grouped so that each batch shares a taxonomy pull request and a
kind of verification.

1. **CLI batch** — `node-cli`, `python-cli`, `go-cli`. Cheapest recipes, fills
   the emptiest `project_type`, and proves the catalog is not only about
   services.
2. **`go-http-service` and `ts-http-service`** — the two languages most missing
   from `api`, and both share the `go`/`hono` taxonomy work above.
3. **`nextjs-fullstack-app`** — the strongest single signal in the demand
   report, and the first `web` blueprint with a database.
4. **`ts-library`** — opens `lib`, and the publishing discipline is something
   this project has already had to learn the hard way.
5. **`python-background-worker` and `terraform-module`** — open `data` and
   `infra`, and both force the catalog to be honest about what CI can and
   cannot prove.
6. **`langgraph-agent`** — the highest-value and highest-risk of the set. It
   goes last on purpose: it needs the §5c tool-surface review to be routine
   first.

---

## Re-reading this

Monthly, with the demand report (CLAUDE.md §6). What to watch:

- Whether any `blueprint-request` issue arrives. One person asking outranks
  every row above, and would reorder this list on the spot.
- Whether `hono` passes `express`, which changes what `ts-http-service` is.
- Whether the Go and Rust MCP SDKs mature enough to move `go-mcp-server` up.

[de-survey]: https://joereis.github.io/practical_data_data_eng_survey/
[iac]: https://www.pulumi.com/blog/infrastructure-as-code-tools/
[agents]: https://www.langchain.com/resources/ai-agent-frameworks
