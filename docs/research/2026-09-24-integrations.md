# Which integrations next — MCP server usage, 2026-09-24

Every row says where its number came from and when it was read. A number
nobody fetched is written "not fetched", never estimated. An integration is a
pinned, permission-documented install recipe for somebody else's server
(ADR 0012). The question here is which upstreams are used enough to be worth a
recipe, and what each recipe would have to pin, name and scope.

**What this is not.** It is not a plan, and it authorises nothing. Ten
integrations are already in the catalog. This report ranks the rest and marks
the ones the catalog should refuse, with the reason each time.

## How the numbers were taken

| Kind                     | How                                                                                   | What it measures                                                             |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| npm weekly downloads     | `api.npmjs.org/downloads/point/last-week/<pkg>`, week 2026-09-15..21, read 2026-09-24 | installs of a stdio package, including every `npx` run and CI re-install     |
| npm version, deprecation | `registry.npmjs.org/<pkg>` `dist-tags.latest`, read 2026-09-24                        | what a recipe would pin, and whether npm marks the package deprecated        |
| PyPI weekly downloads    | `pypistats.org/api/packages/<pkg>/recent` (`last_week`), read 2026-09-24              | installs, including every `uvx` run                                          |
| PyPI version             | `pypi.org/pypi/<pkg>/json` `info.version`, read 2026-09-24                            | what a recipe would pin                                                      |
| Docker Hub pulls         | `hub.docker.com/v2/repositories/<image>/` `pull_count`, read 2026-09-24               | pulls **since the image was published**, not per week                        |
| PulseMCP                 | `pulsemcp.com/servers`, pages 1–2, read 2026-09-24                                    | PulseMCP's "estimated weekly visitors"; it tracks registry downloads closely |
| GitHub                   | `api.github.com/repos/<r>` and `/releases/latest`, read 2026-09-24                    | stars, `archived`, last push, latest release tag                             |

Remote (hosted HTTP) servers have no download count at all. For those,
PulseMCP is the only usage figure, and the pin is the endpoint plus the date it
was verified, because there is no version to pin.

Smithery's "uses" ranking was read and left out. Its top rows are consumer
servers (Gmail, Google Sheets, weather, transit), not tools coding agents use.
A directory's listing count is not usage either. PulseMCP shows 21,833 servers
and Smithery 12,450, and neither figure is used below.

Download counts measure installs, not people. `npx -y <pkg>` downloads again
on many runs, and CI does the same, so the counts give a floor on attention,
not the number of users.

---

## Ranked table

Ordered by the strongest fetched signal. **Status** is `COVERED` when the slug
is already in `integrations/`.

| #   | Proposed slug           | Upstream                                                                                                        | Official?            | Pin (released)                                                        | Usage evidence                                                                                                       | Transport + secrets                                                                                          | Can reach                                                            | Fits                     | Status  | Risk / required scoping                                                                                                          |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | playwright-mcp          | https://github.com/microsoft/playwright-mcp (37.5k stars)                                                       | yes                  | 0.0.82 (2026-09-18)                                                   | npm 5,425,474/wk; Pulse 5.5m; Docker `mcp/playwright` 2,252,498 total                                                | stdio; none                                                                                                  | a local browser, any URL                                             | software, QA             | COVERED | low–medium                                                                                                                       |
| 2   | storybook-mcp           | https://github.com/storybookjs/storybook (`@storybook/addon-mcp`)                                               | yes                  | 10.6.0 (2026-09-02)                                                   | npm 1,439,205/wk; Pulse 1.5m                                                                                         | HTTP `http://localhost:6006/mcp`; none                                                                       | the local Storybook dev server only                                  | frontend, design systems | new     | low. Downloads likely inflated: Storybook 10.4 `init` installs the addon when AI features are chosen. `storybookjs/mcp` archived |
| 3   | chrome-devtools-mcp     | https://github.com/ChromeDevTools/chrome-devtools-mcp (52.6k stars)                                             | yes                  | v1.10.1 (2026-09-23)                                                  | npm 1,026,016/wk; Pulse 1m                                                                                           | stdio; none                                                                                                  | a local Chrome through the DevTools protocol                         | software, performance    | COVERED | medium                                                                                                                           |
| 4   | filesystem-mcp          | https://github.com/modelcontextprotocol/servers                                                                 | reference            | 2026.8.31                                                             | npm 497,862/wk; Pulse 542k                                                                                           | stdio; none                                                                                                  | the directories it is given                                          | all                      | COVERED | medium: scope the directories                                                                                                    |
| 5   | context7-mcp            | https://github.com/upstash/context7 (62.4k stars)                                                               | yes                  | 4.1.1 (2026-09-14)                                                    | npm 354,384/wk; Pulse 563k                                                                                           | stdio or remote; optional API key                                                                            | public library documentation                                         | software                 | COVERED | low                                                                                                                              |
| 6   | grafana-mcp             | https://github.com/grafana/mcp-grafana (3.5k stars)                                                             | yes                  | v1.5.1 (2026-09-17)                                                   | PyPI 166,492/wk; Docker `grafana/mcp-grafana` 3,360,429 total; Pulse 234k                                            | stdio, SSE or streamable HTTP; `GRAFANA_URL`, `GRAFANA_SERVICE_ACCOUNT_TOKEN`                                | dashboards, datasources, alert rules, incidents                      | devops, observability    | new     | medium. The README suggests the broad Editor role; the recipe needs `--disable-write` and scoped RBAC                            |
| 7   | atlassian-mcp           | https://github.com/atlassian/atlassian-mcp-server (1.1k stars), endpoint `https://mcp.atlassian.com/v2/mcp`     | yes (hosted)         | endpoint v2, verified 2026-09-24 (v1 sunsets 2027-03-01)              | official: not fetched. Community `mcp-atlassian` (5.9k stars): PyPI 164,265/wk, Docker `mcp/atlassian` 158,073 total | HTTP; OAuth 2.1, or an API token that an admin must enable                                                   | Jira, Confluence, Bitbucket, Compass, Loom, as the user              | product, docs, software  | new     | medium: writes as the user. Take the official upstream; one integration per upstream                                             |
| 8   | notion-mcp              | https://github.com/makenotion/notion-mcp-server                                                                 | yes                  | 2.5.2 (2026-09-20)                                                    | npm 152,494/wk; Pulse 127k                                                                                           | stdio or hosted; token or OAuth                                                                              | workspace pages                                                      | docs, product            | COVERED | medium                                                                                                                           |
| 9   | time-mcp                | https://github.com/modelcontextprotocol/servers (`src/time`)                                                    | reference            | 2026.8.18                                                             | PyPI 135,155/wk; Pulse 143k; Docker `mcp/time` 962,801 total                                                         | stdio; none                                                                                                  | the system clock and time zones                                      | all                      | new     | low. The repository calls its servers reference implementations, not production-ready                                            |
| 10  | desktop-commander       | https://github.com/wonderwhy-er/DesktopCommanderMCP (9.7k stars)                                                | vendor is the author | 0.2.51 (2026-09-17)                                                   | npm 130,841/wk; Pulse 122k; Docker `mcp/desktop-commander` 229,636 total                                             | stdio; none                                                                                                  | **any shell command, the whole filesystem**                          | —                        | new     | **refuse** (see below)                                                                                                           |
| 11  | agent-device            | https://github.com/callstack/agent-device (4.8k stars)                                                          | yes (Callstack)      | 0.21.13 (2026-09-24)                                                  | npm 129,084/wk; Pulse 117k                                                                                           | stdio (`agent-device mcp`); none                                                                             | iOS and Android simulators and devices, macOS, web                   | mobile                   | new     | medium: drives devices. Node 22.12 or later. CLI-first, MCP second                                                               |
| 12  | azure-mcp               | https://github.com/microsoft/mcp (`servers/Azure.Mcp.Server`)                                                   | yes                  | `@azure/mcp` 3.0.0-beta.46 (2026-09-22)                               | npm 124,434/wk                                                                                                       | stdio; Azure CLI login or DefaultAzureCredential                                                             | 45+ Azure services, within the caller's RBAC                         | cloud, devops            | new     | medium–high. npm `latest` is a beta. Telemetry on by default (`AZURE_MCP_COLLECT_TELEMETRY=false`). Least-privilege RBAC         |
| 13  | linear-mcp              | hosted `https://mcp.linear.app/mcp` (no public server repository)                                               | yes                  | endpoint, verified 2026-09-24                                         | Pulse 123k; npm: none, remote only                                                                                   | HTTP; OAuth 2.1, or a Bearer API key                                                                         | Linear issues, projects, comments                                    | product, software        | new     | low–medium. Read-only endpoint exists: `/mcp/readonly`                                                                           |
| 14  | fetch-mcp               | https://github.com/modelcontextprotocol/servers (`src/fetch`)                                                   | reference            | 2026.8.18                                                             | PyPI 117,055/wk; Pulse 102k; Docker `mcp/fetch` 1,860,047 total                                                      | stdio; none                                                                                                  | any URL, **including local and internal addresses**                  | research, docs           | new     | medium: the upstream README warns it can reach internal IP addresses                                                             |
| 15  | memory-mcp              | https://github.com/modelcontextprotocol/servers                                                                 | reference            | 2026.8.31                                                             | npm 114,646/wk; Pulse 111k                                                                                           | stdio; none                                                                                                  | a local JSON knowledge graph                                         | all                      | COVERED | low                                                                                                                              |
| 16  | blender-mcp             | https://github.com/ahujasid/mcp-for-blender (29.3k stars)                                                       | community            | 2.0.0 (2026-09-16)                                                    | PyPI 107,523/wk; Pulse 295k                                                                                          | stdio plus a Blender add-on socket                                                                           | the local Blender scene                                              | 3D, design, games        | new     | medium–high, community. Tool list not checked this round                                                                         |
| 17  | stripe-mcp              | https://github.com/stripe/ai, endpoint `https://mcp.stripe.com`                                                 | yes                  | endpoint, verified 2026-09-24; local `@stripe/mcp` 0.3.3 (2026-03-24) | Pulse 104k; npm `@stripe/mcp` 8,607/wk                                                                               | HTTP; OAuth, or an Agent API key                                                                             | the Stripe API, read and write, including refunds and payouts        | SaaS, payments           | new     | high-impact writes; Stripe asks a human to confirm refunds and outbound payments. From 2026-10-31 only Agent keys are accepted   |
| 18  | mongodb-mcp             | https://github.com/mongodb-js/mongodb-mcp-server (1.1k stars)                                                   | yes                  | npm 3.0.4 (2026-09-21); GitHub's latest release is v2.1.2             | npm 100,562/wk; Pulse 84.5k; Docker `mcp/mongodb` 154,272 total                                                      | stdio (HTTP optional); `MDB_MCP_CONNECTION_STRING`, or `MDB_MCP_API_CLIENT_ID` + `MDB_MCP_API_CLIENT_SECRET` | the database, and the Atlas organisation and projects                | software, data           | new     | medium: `--readOnly` required                                                                                                    |
| 19  | supabase-mcp            | https://github.com/supabase/mcp (2.9k stars), endpoint `https://mcp.supabase.com/mcp`                           | yes                  | `@supabase/mcp-server-supabase` 0.13.0 (2026-09-17)                   | npm 94,519/wk; Pulse 135k                                                                                            | HTTP; OAuth (a personal access token as the alternative)                                                     | projects, SQL, migrations, edge functions, logs                      | software, backend        | new     | medium–high (`execute_sql`): `?read_only=true&project_ref=<id>` required                                                         |
| 20  | gitlab-mcp              | GitLab built in, `https://<host>/api/v4/mcp` (GitLab 18.6, beta)                                                | yes                  | endpoint (beta), verified 2026-09-24                                  | official: not fetched. Community `@zereight/mcp-gitlab`: npm 93,900/wk; Pulse 70.2k                                  | HTTP; OAuth 2.0 dynamic client registration                                                                  | repositories, merge requests, issues, pipelines                      | software, devops         | new     | medium. The official one is beta; the community one takes a personal access token                                                |
| 21  | sequential-thinking-mcp | https://github.com/modelcontextprotocol/servers                                                                 | reference            | 2026.8.31                                                             | npm 90,206/wk; Pulse 93.6k; Docker `mcp/sequentialthinking` 409,577 total                                            | stdio; none                                                                                                  | nothing outside the process                                          | all                      | new     | low. Whether it adds anything is an open question                                                                                |
| 22  | github-mcp              | https://github.com/github/github-mcp-server (33.2k stars)                                                       | yes                  | v1.12.2 (2026-09-16)                                                  | Pulse lists the archived reference entry at 89.5k; deprecated `@modelcontextprotocol/server-github` npm 88,163/wk    | remote HTTP or Docker; OAuth or a personal access token                                                      | repositories, issues, pull requests, Actions                         | software                 | COVERED | medium                                                                                                                           |
| 23  | sentry-mcp              | https://github.com/getsentry/sentry-mcp                                                                         | yes                  | 0.40.0 (2026-09-24)                                                   | npm 84,198/wk                                                                                                        | remote or stdio; OAuth or token                                                                              | issues and events                                                    | software                 | COVERED | low–medium                                                                                                                       |
| 24  | azure-devops-mcp        | https://github.com/microsoft/azure-devops-mcp (2.0k stars), endpoint `https://mcp.dev.azure.com/{organization}` | yes                  | 2.10.0 (2026-09-09)                                                   | npm 83,924/wk                                                                                                        | remote HTTP or stdio; Entra browser login, or `--authentication azcli`                                       | boards, repositories, pipelines, wiki, test plans                    | software, devops         | new     | medium: scope with `-d core,work-items,...`                                                                                      |
| 25  | next-devtools-mcp       | https://github.com/vercel/next-devtools-mcp                                                                     | yes                  | 0.4.0 (2026-06-24)                                                    | npm 83,493/wk; Pulse 84.5k                                                                                           | stdio; none                                                                                                  | the local Next.js 16+ dev server (`/_next/mcp`) and its bundled docs | web                      | new     | low                                                                                                                              |
| 26  | clickhouse-mcp          | https://github.com/ClickHouse/mcp-clickhouse                                                                    | yes                  | 0.7.0 (2026-09-21)                                                    | PyPI 65,562/wk                                                                                                       | stdio; database host, user, password                                                                         | a ClickHouse database                                                | data                     | new     | medium                                                                                                                           |
| 27  | figma-mcp               | https://github.com/GLips/Figma-Context-MCP (15.9k stars)                                                        | community            | 0.13.2 (2026-06-18)                                                   | npm `figma-developer-mcp` 60,727/wk; Pulse 60.2k. Figma's own server: Pulse 143k                                     | stdio; Figma personal access token                                                                           | design files                                                         | design                   | COVERED | medium. Figma's official server is a different upstream and would be a separate integration                                      |
| 28  | terraform-mcp           | https://github.com/hashicorp/terraform-mcp-server (1.5k stars)                                                  | yes                  | v1.3.0 (2026-08-26)                                                   | Docker `hashicorp/terraform-mcp-server` 1,479,283 total; Pulse 31.1k                                                 | stdio through Docker; the public registry needs no secret                                                    | the Terraform Registry: providers, modules                           | infra                    | new     | low                                                                                                                              |
| 29  | aws-documentation-mcp   | https://github.com/awslabs/mcp (9.7k stars; a monorepo of many servers)                                         | yes                  | `awslabs.aws-documentation-mcp-server` 1.2.1 (2026-09-08)             | PyPI 41,028/wk; Pulse 48.3k. Same repository: `cloudwatch` 49,609/wk, `aws-api` 34,104/wk                            | stdio (`uvx`); the docs server needs none, `aws-api` needs AWS credentials                                   | the public AWS documentation                                         | cloud                    | new     | low for the docs server; **high for `aws-api`**                                                                                  |
| 30  | exa-mcp                 | https://github.com/exa-labs/exa-mcp-server                                                                      | yes                  | 3.4.1 (2026-08-18)                                                    | npm 22,768/wk; Pulse 58k                                                                                             | stdio or remote; `EXA_API_KEY`                                                                               | web search                                                           | research                 | COVERED | low                                                                                                                              |

**The next tier, not ranked in detail:**

| Upstream / package                                                  | Usage                              | Pin         |
| ------------------------------------------------------------------- | ---------------------------------- | ----------- |
| `@launchdarkly/mcp-server`                                          | npm 49,401/wk                      | 0.6.2       |
| `n8n-mcp` (community, 23.0k stars)                                  | npm 46,471/wk                      | 2.89.0      |
| `@shopify/dev-mcp`                                                  | npm 43,665/wk                      | 1.15.4      |
| `xcodebuildmcp` (now under getsentry)                               | npm 42,846/wk                      | 2.7.0       |
| `nx-mcp`                                                            | npm 42,062/wk                      | 0.25.0      |
| `mcp-server-git` (reference)                                        | PyPI 39,753/wk                     | 2026.8.18   |
| `serena-agent` (29.8k stars)                                        | PyPI 31,017/wk                     | 1.7.0       |
| `@mobilenext/mobile-mcp`                                            | npm 29,930/wk                      | 1.0.5       |
| `firecrawl-mcp`                                                     | npm 22,552/wk                      | 3.25.4      |
| `@perplexity-ai/mcp-server`                                         | npm 21,818/wk                      | not fetched |
| `@netlify/mcp`                                                      | npm 21,048/wk                      | 1.15.1      |
| `@sveltejs/mcp`                                                     | npm 17,528/wk                      | not fetched |
| `@brave/brave-search-mcp-server`                                    | npm 17,443/wk                      | 2.1.4       |
| `tavily-mcp`                                                        | npm 16,196/wk                      | 0.2.22      |
| `dbt-mcp`                                                           | PyPI 14,571/wk                     | 2.4.0       |
| Cloudflare, remote (`https://mcp.cloudflare.com/mcp` and 15 others) | Pulse 52.7k ("Cloudflare Workers") | endpoints   |
| Vercel, remote (`https://mcp.vercel.com`, beta)                     | Pulse 34.5k                        | endpoint    |

`awslabs/mcp` holds many servers in one repository. "One integration per
upstream" (rule 9) needs a decision there: one per server, or one per
repository.

---

## Vendor-documented install commands

For the top ten new rows by rank, skipping `desktop-commander` (refused),
`time-mcp` (a trivial reference server) and `blender-mcp` (niche, community).
Anything not quoted is **not documented** by the vendor.

| Slug          | Claude Code                                                                                                                            | Codex                                                                                                                                             | Gemini CLI                                                                                  | Source                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| storybook-mcp | not documented ("follow your agent's documentation"). Addon: `npx storybook add @storybook/addon-mcp`; URL `http://localhost:6006/mcp` | not documented                                                                                                                                    | not documented                                                                              | https://storybook.js.org/docs/ai/mcp/overview                                                                      |
| grafana-mcp   | not documented; only a Claude Desktop JSON block (`"command": "uvx", "args": ["mcp-grafana"]` with the two env vars)                   | not documented                                                                                                                                    | not documented                                                                              | https://github.com/grafana/mcp-grafana                                                                             |
| atlassian-mcp | `claude mcp add --transport http atlassian https://mcp.atlassian.com/v2/mcp`                                                           | `codex mcp add atlassian --url https://mcp.atlassian.com/v2/mcp`                                                                                  | referenced, no command on the pages read                                                    | https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/ |
| agent-device  | not documented; generic `"command": "agent-device", "args": ["mcp"]`                                                                   | not documented                                                                                                                                    | not documented                                                                              | https://github.com/callstack/agent-device                                                                          |
| azure-mcp     | `/plugin install azure@claude-plugins-official` (a plugin, not `mcp add`). Generic: `npx -y @azure/mcp@latest server start`            | not documented                                                                                                                                    | not documented                                                                              | https://github.com/microsoft/mcp/blob/main/servers/Azure.Mcp.Server/README.md                                      |
| linear-mcp    | `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`, then `/mcp`                                                | `codex mcp add linear --url https://mcp.linear.app/mcp`, then `codex mcp login linear`; the page also shows `experimental_use_rmcp_client = true` | not documented                                                                              | https://linear.app/docs/mcp                                                                                        |
| stripe-mcp    | `claude mcp add --transport http stripe https://mcp.stripe.com/`, then `claude /mcp`                                                   | `codex mcp add stripe --url https://mcp.stripe.com`; with an Agent key, `bearer_token_env_var` names the environment variable                     | not documented                                                                              | https://docs.stripe.com/mcp                                                                                        |
| mongodb-mcp   | `npx -y mongodb-mcp-server@latest setup`                                                                                               | `codex plugin marketplace add mongodb/agent-skills`                                                                                               | extension at `https://geminicli.com/extensions/?name=mongodbagent-skills`                   | https://github.com/mongodb-js/mongodb-mcp-server                                                                   |
| supabase-mcp  | `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"`                                              | `codex mcp add supabase --url "https://mcp.supabase.com/mcp"`, then `codex mcp login supabase`                                                    | `gemini mcp add -t http supabase "https://mcp.supabase.com/mcp"`, then `/mcp auth supabase` | https://supabase.com/docs/guides/getting-started/mcp                                                               |
| gitlab-mcp    | `claude mcp add -s user --transport http GitLab https://<gitlab.example.com>/api/v4/mcp`                                               | `codex mcp add GitLab --url "https://<gitlab.example.com>/api/v4/mcp"`                                                                            | `httpUrl` in `~/.gemini/settings.json`, then `gemini mcp auth GitLab`                       | https://docs.gitlab.com/user/model_context_protocol/mcp_server/                                                    |

Also documented, below the top ten:

| Slug              | What the vendor documents                                                                                                                                                                              | Source                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| azure-devops-mcp  | remote `https://mcp.dev.azure.com/{organization}` as VS Code JSON; Claude Code and Codex named as supported, no command given                                                                          | https://github.com/microsoft/azure-devops-mcp             |
| next-devtools-mcp | `.mcp.json` only: `"command": "npx", "args": ["-y", "next-devtools-mcp@latest"]`                                                                                                                       | https://nextjs.org/docs/app/guides/mcp                    |
| vercel-mcp        | `claude mcp add --transport http vercel https://mcp.vercel.com`; `codex mcp add vercel --url https://mcp.vercel.com`; Gemini CLI: `"command": "npx", "args": ["mcp-remote", "https://mcp.vercel.com"]` | https://vercel.com/docs/agent-resources/vercel-mcp        |
| serena            | `serena setup claude-code`, or `claude mcp add --scope user serena -- serena start-mcp-server --context claude-code --project-from-cwd`; `serena setup codex`; Gemini CLI not documented               | https://oraios.github.io/serena/02-usage/030_clients.html |

**None of these can be copied as they stand.** MongoDB, Azure and Next.js
install `@latest`, and Vercel's Gemini snippet runs `mcp-remote` with no
version. `forgeprint lint-setup` refuses a moving tag, so every recipe pins
its own version in place of the vendor's.

---

## Categories

| Category                          | Members (weekly figure)                                                                                        | Reading                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Browser and device automation     | Playwright 5.43M, Storybook 1.44M, Chrome DevTools 1.03M, agent-device 129k, xcodebuildmcp 43k, mobile-mcp 30k | Ahead of every other category by an order of magnitude       |
| Documentation lookup              | Context7 354k, AWS docs 41k, next-devtools (bundled docs) 83k                                                  | One dominant server                                          |
| Reference utilities               | filesystem 498k, fetch 117k (PyPI), time 135k (PyPI), memory 115k, sequential-thinking 90k                     | Still heavily used; most of the demand for "general" servers |
| Issue trackers and source control | Atlassian (community) 164k, GitLab (community) 94k, Azure DevOps 84k; Linear Pulse 123k; GitHub remote         | The official ones are moving to hosted OAuth endpoints       |
| Databases and backend services    | MongoDB 101k, Supabase 95k, ClickHouse 66k (PyPI)                                                              | Every one needs a read-only flag in the recipe               |
| Cloud and infrastructure          | Azure 124k; Terraform 1.48M Docker pulls total; AWS; Cloudflare and Vercel remote                              | Broadest permissions of any category                         |
| Observability                     | Grafana 166k (PyPI), Sentry 84k                                                                                | Grafana is the largest uncovered one                         |
| Web search                        | Exa 23k, Firecrawl 23k, Perplexity 22k, Brave 17k, Tavily 16k                                                  | Small and fragmented; each needs a paid API key              |

Hosted OAuth endpoints are now what Linear, Atlassian, Stripe, Supabase,
Vercel, GitLab, Azure DevOps and Cloudflare document first. A recipe for one of
them pins an endpoint and the date it was verified; `upstream_version` has no
package to point at.

---

## Refuse

| Upstream                                                                                                                                                               | Reason                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modelcontextprotocol/server-{github,postgres,slack,puppeteer,brave-search,gdrive,gitlab,redis,google-maps,sqlite}`                                                   | Moved to `modelcontextprotocol/servers-archived` (archived) and marked deprecated on npm. Still installed: github 88,163/wk, slack 74,173/wk, puppeteer 23,092/wk, brave-search 16,849/wk. Nobody patches them. Point to the vendor server instead |
| `@modelcontextprotocol/server-everything` (217,048/wk)                                                                                                                 | A protocol test and demo server. Nothing to give a user                                                                                                                                                                                            |
| `mcp-remote` (784,494/wk)                                                                                                                                              | A stdio-to-HTTP bridge, not an integration. CVE-2025-6514, a critical OS command injection, affected 0.0.5–0.1.15 and was fixed in 0.1.16. When a recipe needs the bridge, it pins `mcp-remote@0.14.3` (upstream now `punkpeye/mcp-remote`)        |
| desktop-commander                                                                                                                                                      | Runs any shell command and reads and writes the whole filesystem, with no permission boundary to document                                                                                                                                          |
| browserbase/mcp-server-browserbase                                                                                                                                     | Repository archived; last push 2026-07-20                                                                                                                                                                                                          |
| BrowserMCP/mcp                                                                                                                                                         | Last push 2025-04-24                                                                                                                                                                                                                               |
| executeautomation/mcp-playwright                                                                                                                                       | Last push 2025-12-13, and it duplicates the official Playwright server                                                                                                                                                                             |
| Azure/azure-mcp                                                                                                                                                        | Archived; moved into microsoft/mcp                                                                                                                                                                                                                 |
| semgrep/mcp, PostHog/mcp                                                                                                                                               | Both repositories archived                                                                                                                                                                                                                         |
| BeehiveInnovations/pal-mcp-server (formerly zen-mcp-server)                                                                                                            | Last push 2025-12-15                                                                                                                                                                                                                               |
| Docker images `mcp/git` (updated 2025-06-16), `mcp/time` (2025-06-17), `mcp/sequentialthinking` (2025-05-02), `mcp/memory` (2025-05-02), `mcp/filesystem` (2025-09-09) | Older than the upstream packages. `mcp/git` predates the fixes for CVE-2025-68143, CVE-2025-68144 and CVE-2025-68145. A reference-server recipe pins the package, never these images                                                               |
| `mcp-server-git` below 2025.12.17                                                                                                                                      | The three CVEs above (path traversal, argument injection). Accept only at the current 2026.8.18                                                                                                                                                    |
| `browser-use` (PyPI 1,789,820/wk), `fastmcp`, `@vercel/mcp-adapter`, `@clerk/mcp-tools`                                                                                | Libraries, not servers. Their downloads say nothing about MCP use                                                                                                                                                                                  |

## Accept only with scoping in the recipe

| Slug              | What the recipe must set                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| supabase-mcp      | `?read_only=true&project_ref=<id>` on the endpoint                                                                      |
| mongodb-mcp       | `--readOnly`; the connection string in an environment variable, not a command-line argument                             |
| grafana-mcp       | `--disable-write`; a service account with only the RBAC scopes the enabled tools need, not Editor                       |
| azure-devops-mcp  | `-d` with only the domains needed (`core` is always required)                                                           |
| linear-mcp        | the `/mcp/readonly` endpoint, or the `read` OAuth scope, unless writes are the point                                    |
| stripe-mcp        | OAuth, or an Agent API key; no full-access secret key (refused by Stripe from 2026-10-31)                               |
| azure-mcp         | least-privilege RBAC; `AZURE_MCP_COLLECT_TELEMETRY=false`; the beta status stated                                       |
| aws-api (awslabs) | least-privilege IAM; the docs server needs no credentials and is the safer first recipe                                 |
| fetch-mcp         | a note that it reaches internal addresses, so it does not belong on a machine with private services it should not touch |
| atlassian-mcp     | human confirmation for writes; API token only where an admin has enabled it                                             |

---

## Pin updates for existing integrations

Compared with `upstream_version` in each manifest on 2026-09-24.

| Integration         | Manifest pin | Upstream now                                                        | Action     |
| ------------------- | ------------ | ------------------------------------------------------------------- | ---------- |
| chrome-devtools-mcp | 1.9.0        | 1.10.1 (npm; release tag `chrome-devtools-mcp-v1.10.1`, 2026-09-23) | bump       |
| sentry-mcp          | 0.39.0       | 0.40.0 (2026-09-24)                                                 | bump       |
| context7-mcp        | 4.1.1        | 4.1.1                                                               | up to date |
| exa-mcp             | 3.4.1        | 3.4.1                                                               | up to date |
| figma-mcp           | 0.13.2       | 0.13.2                                                              | up to date |
| filesystem-mcp      | 2026.8.31    | 2026.8.31                                                           | up to date |
| github-mcp          | v1.12.2      | v1.12.2                                                             | up to date |
| memory-mcp          | 2026.8.31    | 2026.8.31                                                           | up to date |
| notion-mcp          | 2.5.2        | 2.5.2                                                               | up to date |
| playwright-mcp      | 0.0.82       | 0.0.82                                                              | up to date |

---

## Not verified

- Which tools `blender-mcp` 2.0.0 exposes, and whether one of them runs
  arbitrary Python inside Blender.
- Whether the Terraform server needs an HCP token for anything beyond the
  public registry.
- Whether `mcp-clickhouse` runs read-only by default.
- The Gemini CLI commands for Atlassian, Linear and Stripe. The vendor pages
  that were read do not quote one.
- MongoDB's version lines: npm `latest` is 3.0.4 while GitHub's latest release
  is v2.1.2. Which one the recipe pins needs a look at the release notes.
- CVE-2026-27735 (`mcp-server-git`, path traversal) was seen in a search
  result title only; the advisory itself was not read.
- Usage for the official Atlassian and GitLab servers. Both are hosted
  endpoints, and no source measured them separately from the community servers.

## What this round deliberately did not do

- Write or change any integration. The pin bumps above are findings, not edits.
- Run any of these servers, or authenticate to any hosted endpoint.
- Rank by GitHub stars. Stars measure attention to a repository, and several
  of the most-starred repositories here are libraries, awesome-lists or
  archived projects.
- Use a directory's listing count, or Smithery's consumer-heavy "uses", as
  usage.
- Recommend servers outside software work (mail, calendars, finance data)
  that directories rank highly. Those belong to a roles round, not this one.

## Sources

Read 2026-09-24.

- npm: `https://api.npmjs.org/downloads/point/last-week/<pkg>`, `https://registry.npmjs.org/<pkg>`
- PyPI: `https://pypistats.org/api/packages/<pkg>/recent`, `https://pypi.org/pypi/<pkg>/json`
- Docker Hub: `https://hub.docker.com/v2/repositories/<image>/`
- GitHub: `https://api.github.com/repos/<owner>/<repo>` and `/releases/latest`
- Directories: https://www.pulsemcp.com/servers, https://smithery.ai/servers, https://registry.modelcontextprotocol.io/v0/servers?search=linear
- Reference server status: https://github.com/modelcontextprotocol/servers, https://github.com/modelcontextprotocol/servers/tree/main/src/fetch
- Vendor documentation:
  - https://supabase.com/docs/guides/getting-started/mcp
  - https://linear.app/docs/mcp
  - https://docs.stripe.com/mcp
  - https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
  - https://github.com/atlassian/atlassian-mcp-server
  - https://github.com/mongodb-js/mongodb-mcp-server
  - https://github.com/grafana/mcp-grafana
  - https://github.com/microsoft/mcp/blob/main/servers/Azure.Mcp.Server/README.md
  - https://github.com/microsoft/azure-devops-mcp
  - https://oraios.github.io/serena/02-usage/030_clients.html
  - https://nextjs.org/docs/app/guides/mcp
  - https://vercel.com/docs/agent-resources/vercel-mcp
  - https://github.com/cloudflare/mcp-server-cloudflare
  - https://docs.gitlab.com/user/model_context_protocol/mcp_server/
  - https://storybook.js.org/docs/ai/mcp/overview
  - https://github.com/callstack/agent-device
- Security:
  - https://github.com/advisories/GHSA-6xpm-ggf7-wc3p (CVE-2025-6514)
  - https://jfrog.com/blog/2025-6514-critical-mcp-remote-rce-vulnerability/
  - https://thehackernews.com/2026/01/three-flaws-in-anthropic-mcp-git-server.html
  - https://www.sentinelone.com/vulnerability-database/cve-2025-68145/
  - https://vulert.com/vuln-db/CVE-2026-27735
