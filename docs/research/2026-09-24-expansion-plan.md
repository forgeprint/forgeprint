# Catalog expansion plan, 2026-09-24

The work that follows from the four research reports of 2026-09-24:
[demand](2026-09-24-demand.md) (blueprints), [roles](2026-09-24-roles.md)
(experts), [integrations](2026-09-24-integrations.md) and
[crews](2026-09-24-crews.md).

The core maintainer approved the whole candidate list on 2026-09-24 and asked for
it to be built phase by phase, in order, with conflicts between candidates
decided during the work and recorded here. This file is the to-do list: an item
is ticked when its pull request is open, and the PR number goes next to it.

**What does not change.**

- One pull request per unit (one blueprint, one expert, one crew, one
  integration). A taxonomy change is its own pull request, and it comes first.
- Every drafted unit is `tier: community` and `provenance: generated`
  (ADR 0011). None of it becomes `official` without a human who built on it.
- The gate: `validate`, `lint-setup`, `similarity`, `render-check`, and for a
  blueprint `test-setup` and an architecture and security review (§5c) before
  its pull request opens.
- Nothing is merged by an agent. The maintainer merges.
- Every unit PR regenerates `docs/index.json` and the site, so the open ones
  conflict each time one merges. They are rebuilt on `main` (the unit folder
  kept, the derived files regenerated) rather than resolved by hand.
- Before Phase 4: the setup-test runner gained Java, PHP, Ruby, Rust, Flutter,
  Elixir and uv (#86), and `lint-setup` the registries those stacks install
  from (#87). A blueprint in one of those languages cannot pass CI without
  them.

---

## Decisions taken while planning

| #   | Conflict                                                                                                                                                                       | Decision                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Rule 9 allows one expert per `role + domain + seniority`, and `dotnet-senior-architect` holds the architect triple                                                             | The maintainer's call: experts may be multiplied per language, the way `dotnet-senior-architect` already is. An ADR widens the expert key to `role + domain + seniority + languages`; an expert with no `languages` is the stack-neutral one for its triple, and there is at most one of those |
| D2  | `test-engineer` and `qa-automation-lead` overlap                                                                                                                               | Both, with the boundary written into each: `test-engineer` works inside the code (unit tests, TDD, test doubles); `qa-automation-lead` owns strategy, E2E and the release gate                                                                                                                 |
| D3  | `prompt-engineer` on its own is taste unless tied to evals                                                                                                                     | Folded into `agent-designer`, whose checklists include an eval set                                                                                                                                                                                                                             |
| D4  | `ux-designer` and `ui-designer` have high demand and no checkable standard                                                                                                     | Refused. What is checkable about UI goes to `accessibility-specialist` and `frontend-engineer` (WCAG 2.2, Core Web Vitals)                                                                                                                                                                     |
| D5  | `ui-build-crew` needed `ux-designer`                                                                                                                                           | Members become `frontend-engineer`, `accessibility-specialist`, `qa-automation-lead`, with `figma-mcp` bringing the design in                                                                                                                                                                  |
| D6  | `launch-growth-crew` needed `growth-marketer` and `content-strategist`, both refused as taste                                                                                  | Replaced by `web-launch-crew`: `technical-seo-specialist`, `performance-engineer`, `accessibility-specialist`, `product-manager` — everything a launch is checked against                                                                                                                      |
| D7  | `appsec-audit-crew` overlaps `api-hardening-crew`                                                                                                                              | Kept as its own crew with a different member set (`appsec-engineer`, `privacy-engineer`, `security-reviewer`, `qa-automation-lead`); its `not_for` names hardening one API and points there                                                                                                    |
| D8  | `penetration-tester` is dual-use                                                                                                                                               | Refused. Threat modelling and verification live in `appsec-engineer`                                                                                                                                                                                                                           |
| D9  | `fullstack-squad-crew` is the parallel-coding shape the evidence warns against                                                                                                 | Deferred until Scenario D reports (ADR 0014)                                                                                                                                                                                                                                                   |
| D10 | `ml-platform-crew` has the weakest evidence, and `data-scientist` is mostly judgement                                                                                          | Not built this round                                                                                                                                                                                                                                                                           |
| D11 | `nextjs-saas-starter` would nearly duplicate `nextjs-fullstack-app`                                                                                                            | Not a new blueprint. Payments become an option on `nextjs-fullstack-app` (ADR 0001: variation through options)                                                                                                                                                                                 |
| D12 | `express-api` would nearly duplicate `ts-http-service`                                                                                                                         | Not a new blueprint. Express becomes a framework option on `ts-http-service`                                                                                                                                                                                                                   |
| D13 | `flask-api` shares type and requirements with `fastapi-service`                                                                                                                | Built: a different stack is a different triple, and Flask is still the second Python web framework by use                                                                                                                                                                                      |
| D14 | `vite-react-spa` shares tags with `nextjs-fullstack-app`                                                                                                                       | Built as a client-only SPA with no server, which is the difference the similarity report has to see; if it still flags above 70%, the overlap is resolved in the PR rather than by dropping it                                                                                                 |
| D15 | Official versus community servers for the same product (Atlassian, GitLab)                                                                                                     | The vendor's own server, always. One integration per upstream; the community one is not listed                                                                                                                                                                                                 |
| D16 | `azure-mcp`'s npm `latest` is a beta                                                                                                                                           | Built only when a non-beta version exists; until then held, with the reason                                                                                                                                                                                                                    |
| D17 | `blender-mcp` is community-maintained and its tool list, including code execution, was not verified                                                                            | Held until the tool list is read                                                                                                                                                                                                                                                               |
| D18 | `incident-commander` and `site-reliability-engineer` overlap                                                                                                                   | One expert, `site-reliability-engineer`, owning SLOs, incident handling and the postmortem; `observability-engineer` separate                                                                                                                                                                  |
| D19 | `developer-advocate` in `docs-crew` is marketing more than documentation                                                                                                       | Refused. `docs-crew` is `documentation-architect`, `technical-writer`, `api-designer`                                                                                                                                                                                                          |
| D20 | Three popular ways of working have no taxonomy role: code review, debugging, modernization                                                                                     | Added to the taxonomy first: `code-reviewer`, `debugger`, `modernization-engineer`                                                                                                                                                                                                             |
| D21 | The mobile expert would be too vague across four stacks                                                                                                                        | One per stack, through D1: React Native, Flutter, Android (Kotlin). SwiftUI waits for a macOS-capable check                                                                                                                                                                                    |
| D22 | `godot-game` could need a `gdscript` language value                                                                                                                            | C# with Godot, which fits the existing taxonomy                                                                                                                                                                                                                                                |
| D23 | Held-back blueprints need new project types (`desktop`, `extension`)                                                                                                           | Both added in the taxonomy PR; `tauri-desktop-app` and `browser-extension` are built in the last blueprint phase. Electron is not built: Tauri covers the type with a smaller, CI-friendly toolchain                                                                                           |
| D24 | The research suggested separate web and backend performance experts; the plan named one `performance-engineer`                                                                 | One expert covering both, measure-first for each; `overview.md` names the split as the way it would grow if the two diverge                                                                                                                                                                    |
| D25 | A vendor-hosted MCP server has no package version to pin                                                                                                                       | `upstream_version` is the endpoint's own version when it has one (Atlassian `v2`), otherwise `hosted`; the README says it cannot be pinned and gives the date it was verified                                                                                                                  |
| D26 | `gitlab-mcp` is a beta feature, and D16 holds `azure-mcp` back for being a beta                                                                                                | Kept. D16 is about a beta _package_ being the only thing to pin; GitLab's pin is a released GitLab version, and the beta status is stated in the summary and README                                                                                                                            |
| D27 | `postgres-database-administrator` is Postgres-specific, but the expert key has no `stack`                                                                                      | Slug and `stack: [postgres]` name it; a second database's administrator would need `languages` or a different role to stay unique, decided when one is proposed                                                                                                                                |
| D28 | `postgres-mcp` 0.3.0 does not cap its MCP SDK dependency, and SDK 2.0 removed a module it imports                                                                              | Kept, with `--with "mcp<2"` in every command. Verified 2026-09-25 in a clean container: it starts with SDK 1.30.0 and fails with 2.2.0. The constraint goes at the first upstream release that carries the fix                                                                                 |
| D29 | Install commands expanded the secret in the shell, so Gemini CLI and Codex wrote the key into their config files in plain text; Claude Code got a bare `$VAR` it never expands | Secrets stay references. Claude Code: `${VAR}` in the JSON. Gemini CLI: the value in single quotes, which Gemini expands at start. Codex: `--env` has no by-name form, so the README names `env_vars` as the way to keep only the name                                                         |
| D30 | `shopify-dev-mcp` has no public source repository                                                                                                                              | Kept, with Shopify's documentation page as `upstream`. The tool list and instrumentation were read from the published npm bundle; the README says so                                                                                                                                           |
| D31 | `xcodebuild-mcp` renamed itself upstream on 2026-09-23 (`getsentry/MobileBuildMCP`, npm `mobilebuildmcp`)                                                                      | The slug follows upstream: `mobilebuild-mcp`                                                                                                                                                                                                                                                   |
| D32 | `launchdarkly-mcp` reads its key only from a command-line argument                                                                                                             | No Codex command: Codex can only store the expanded key, in plain text, and `env_vars` cannot help a server that ignores its environment                                                                                                                                                       |
| D33 | A crew names experts that exist only in open pull requests, and `validate` refuses a slug it cannot find                                                                       | A crew is built once every member and integration is on `main`; until then it waits, with the pull requests it needs named                                                                                                                                                                     |

## Refused this round

Recorded so the next round does not re-litigate them without new evidence.

| Candidate                                                                                                                                                    | Why                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `ux-designer`, `ui-designer`, "taste" design skills                                                                                                          | No checkable standard (D4)                                                           |
| Personas (whimsy, joker, beast-mode and the like)                                                                                                            | A costume, not a way of working (ADR 0012)                                           |
| Language "-pro" agents                                                                                                                                       | Stack knowledge belongs in a blueprint                                               |
| `growth-marketer`, `content-strategist`, copywriting                                                                                                         | No standard to check against (D6)                                                    |
| `penetration-tester`                                                                                                                                         | Dual-use (D8)                                                                        |
| `developer-advocate`                                                                                                                                         | Marketing more than documentation (D19)                                              |
| SwiftUI and Unity blueprints                                                                                                                                 | A macOS runner or a licence; neither runs in plain Linux CI                          |
| Archived `@modelcontextprotocol/server-*` packages, `server-everything`, `mcp-remote` as an integration, `desktop-commander`, archived upstream repositories | Unpatched, not an integration, or unscoped shell access; see the integrations report |

---

## Phase 0 — groundwork

- [x] 0.1 The four research reports and this plan — #57
- [x] 0.2 ADR 0015: experts per language (D1), CLAUDE.md rule 9, and `validate`/`similarity` keyed on `role + domain + seniority + languages` — #58
- [x] 0.3 Taxonomy: roles `code-reviewer`, `debugger`, `modernization-engineer` (D20); stack values `expo`, `clap`, `sqlx`, `nuxt`, `tanstack`, `ai-sdk`, `pgvector`, `streamlit`, `dbt`, `duckdb`, `phaser`, `tauri`, `wxt`; project types `desktop`, `extension` (D23) — #59
- [x] 0.4 Pin updates for existing integrations that have fallen behind (`chrome-devtools-mcp`, `sentry-mcp`, and any other the integrations report names) — #60, #61

## Phase 1 — the experts most asked for, and the ones crews need

- [x] `frontend-engineer` — measurable only: WCAG 2.2, Core Web Vitals — #63
- [x] `test-engineer` — TDD and tests in the code (D2) — #64
- [x] `code-reviewer` — correctness and maintainability; security stays with `security-reviewer` — #82
- [x] `api-designer` — OpenAPI 3.2, RFC 9110, RFC 9457, OWASP API Top 10 — #65
- [x] `performance-engineer` — web: Core Web Vitals, Lighthouse, USE method — #62
- [x] `debugger` — reproduce, isolate, root cause, regression test — #80
- [x] `database-administrator` — Postgres: schema, indexes, migrations (pipelines stay with `sql-data-engineer`) — #74
- [x] `agent-designer` — MCP spec, Agent Skills, OWASP LLM Top 10, evals (D3) — #69
- [x] `accessibility-specialist` — WCAG 2.2, WAI-ARIA 1.2, EN 301 549 — #71
- [x] `research-engineer` — sourced technical research with graded evidence — #70

## Phase 2 — architects and backend engineers per language (D1)

- [x] `typescript-senior-architect` — #83
- [x] `python-senior-architect` — #88
- [x] `go-senior-architect` — #90
- [x] `java-senior-architect` — #92
- [x] `typescript-backend-engineer` — #85
- [x] `python-backend-engineer` — #89
- [x] `java-backend-engineer` — #91
- [x] `go-backend-engineer` — #93

## Phase 3 — integrations, the most used new ones

- [x] `grafana-mcp` — `--disable-write`, scoped service account — #68
- [x] `atlassian-mcp` — the official remote server (D15) — #67
- [x] `linear-mcp` — read-only endpoint by default — #73
- [x] `supabase-mcp` — `read_only=true`, `project_ref` — #66
- [x] `mongodb-mcp` — `--readOnly` — #78
- [x] `terraform-mcp` — #75
- [x] `stripe-mcp` — Agent keys after 2026-10-31 — #76
- [x] `azure-devops-mcp` — domains scoped with `-d` — #72
- [x] `gitlab-mcp` — the built-in server (D15) — #77
- [x] `next-devtools-mcp` — #79
- [x] `storybook-mcp` — #81

## Phase 4 — blueprints: the web and API gaps

- [x] `django-web-app` — #101
- [x] `spring-boot-api` — #107 (setup-test waits for #86: Java 25)
- [x] `laravel-web-app` — #117
- [x] `vite-react-spa` (D14) — #114
- [x] `nestjs-api` — #109
- [x] `python-library` — #95 (setup-test waits for #86: uv)
- [x] `rails-web-app` — #113 (setup-test waits for #86: Ruby 4.0)

## Phase 5 — blueprints: mobile, Rust and AI applications

- [ ] `flutter-mobile-app`
- [x] `expo-mobile-app` — #128
- [x] `android-compose-app` — #150 (waits for #86: JDK 21+, and #87: Gradle hosts, xmlns)
- [x] `rust-cli` — #125
- [x] `rust-axum-service` — #145
- [x] `ai-chat-web-app` — #120
- [x] `python-rag-service` — #129

## Phase 6 — blueprints: the rest, and two options on existing ones

- [x] `angular-app` — #154
- [x] `nuxt-app` — #160
- [x] `sveltekit-app` — #161
- [x] `blazor-web-app` — #156
- [x] `tanstack-start-app` — #166
- [x] `flask-api` (D13) — #162
- [x] `streamlit-data-app` — #165
- [x] `dbt-duckdb-pipeline` — #169
- [x] `godot-game` (D22) — #167
- [x] `phaser-web-game` — #164
- [x] `tauri-desktop-app` (D23) — #173
- [x] `browser-extension` (D23) — #168
- [ ] `phoenix-liveview-app`
- [x] `bevy-game` — #171
- [x] Option: payments on `nextjs-fullstack-app` (D11) — #172
- [x] Option: Express on `ts-http-service` (D12) — #170

## Phase 7 — the remaining experts

- [x] `react-native-mobile-engineer`, `flutter-mobile-engineer`, `android-mobile-engineer` (D21) — #130, #133, #137
- [x] `site-reliability-engineer` (D18) — #146
- [x] `observability-engineer` — #147
- [x] `release-manager` — git hygiene, SemVer, Conventional Commits, Keep a Changelog — #148
- [x] `technical-seo-specialist` — #153
- [x] `modernization-engineer` — #152
- [x] `appsec-engineer` — #149
- [x] `privacy-engineer` — #151
- [x] `business-analyst` — #157
- [x] `ux-researcher` — methods only: ISO 9241-210, usability testing — #158
- [x] `documentation-architect` — #155
- [x] `coding-mentor` — #159
- [x] Architects for the languages the new blueprints add: `php`, `ruby`, `rust`, `kotlin`, `dart` — #135, #139, #144, #140, #143

## Phase 8 — integrations, the second tier

- [x] `fetch-mcp` — with the internal-network warning — #97
- [x] `time-mcp` — #99
- [x] `sequential-thinking-mcp` — #103
- [x] `git-mcp` — at 2026.8.18 or later only — #106
- [x] `postgres-mcp` — the maintained community server, not the archived reference one — #111 (D28)
- [x] `agent-device` — #141
- [x] `mobile-mcp` — #138
- [x] `aws-documentation-mcp` — #112
- [x] `clickhouse-mcp` — #115
- [x] `dbt-mcp` — #116
- [x] `serena-mcp` — #118
- [x] `nx-mcp` — #119
- [x] `launchdarkly-mcp` — #136 (D32)
- [x] `shopify-dev-mcp` — #122 (D30)
- [x] `firecrawl-mcp` — #123
- [x] `brave-search-mcp` — #124
- [x] `tavily-mcp` — #126
- [x] `perplexity-mcp` — #127
- [x] `netlify-mcp` — #132
- [x] `cloudflare-mcp` — #134
- [x] `vercel-mcp` — #131
- [x] `svelte-mcp` — #121
- [x] `xcodebuild-mcp` — #142, as `mobilebuild-mcp` (D31)
- [ ] `azure-mcp` — held until a non-beta version exists (D16)
- [ ] `blender-mcp` — held until its tool list is verified (D17)

## Phase 9 — crews

Each has three or four members, one of them a checking role, and a `not_for`
that names sequential, small and same-file work.

- [ ] `code-review-crew`
- [ ] `tech-research-crew`
- [x] `spec-driven-feature-crew` — #174
- [ ] `ui-build-crew` (D5)
- [ ] `incident-response-crew`
- [ ] `llm-app-crew`
- [ ] `legacy-modernization-crew`
- [ ] `product-discovery-crew`
- [ ] `release-crew`
- [ ] `docs-crew` (D19)
- [ ] `performance-crew`
- [ ] `appsec-audit-crew` (D7)
- [ ] `data-pipeline-crew`
- [ ] `web-launch-crew` (D6)
- [ ] `mobile-app-crew`
- Deferred: `fullstack-squad-crew` (D9), `ml-platform-crew` (D10)

The other fourteen wait for members still in review (D33): `code-review-crew`
#82; `tech-research-crew` #70; `ui-build-crew` #71; `incident-response-crew`
#146, #147, #80, #68; `llm-app-crew` #69; `legacy-modernization-crew` #152,
#157, #118; `product-discovery-crew` #157, #158; `release-crew` #148, #146;
`docs-crew` #155; `performance-crew` #147, #74, #111; `appsec-audit-crew` #149,
#151; `data-pipeline-crew` #74, #111, #116; `web-launch-crew` #153, #71;
`mobile-app-crew` #130, #71, #148, #138. `phoenix-liveview-app` and
`flutter-mobile-app` wait for the CI toolchains in #86.

---

## After the last phase

A new dated research round (the skill's monthly cadence) reads what was built
against what was asked for. The measure is not how many units merged; it is
whether `resolve` and `recommend_experts` stopped answering `no_match` for the
profiles the reports found.
