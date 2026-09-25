# Netlify MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [netlify/netlify-mcp](https://github.com/netlify/netlify-mcp),
> pinned at `1.15.1` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Netlify's own MCP server, run locally from the npm package `@netlify/mcp`. The agent works with Netlify through the API instead of through a description of the dashboard: it lists teams and projects, reads deploys, creates a project, deploys a local folder, and manages environment variables, forms, visitor access controls and extensions. A `netlify-coding-rules` tool fetches Netlify's current guidance for writing Functions, Edge Functions, Blobs and the rest from `docs.netlify.com`.

The tools are grouped by area — user, team, project, deploy, extension — with a read and a write tool for each (`--verbose` registers one tool per operation instead). Read from the published `1.15.1` package on 2026-09-25, the write operations are:

- `create-new-project`, `update-project-name`
- `deploy-site` — zips a local folder and uploads it to start a Netlify build
- `manage-env-vars` — creates, updates and **deletes** environment variables and secrets, for any deploy context including `production`
- `update-visitor-access-controls` — password protection and SSO for all projects or non-production ones
- `update-forms`, `manage-form-submissions` — including **deleting** submissions
- `change-extension-installation`, `initialize-database` — installs or removes extensions, and sets up a Netlify database

It needs Node.js 22 or later.

## What it can reach

Reads and changes every Netlify team and project your login reaches: creates projects, zips and uploads a local folder to deploy it, sets and deletes environment variables and secrets, changes access controls and forms, installs extensions.

## Secrets it needs

None in the install command. The server looks for a token in this order:

1. `NETLIFY_PERSONAL_ACCESS_TOKEN` in its environment, if you set one.
2. The token the Netlify CLI saved when you ran `netlify login`.
3. If neither exists, it runs `netlify login` itself, which opens a browser
   window for you to sign in. That needs the Netlify CLI on your `PATH`.

The CLI login is a token for your whole account. If you would rather give the
server a token you can revoke on its own, create a personal access token in
the Netlify dashboard (User settings → OAuth → New access token), put it in
your environment, and pass it by name — never by value:

- Claude Code: `claude mcp add-json netlify '{"command":"npx","args":["-y","@netlify/mcp@1.15.1"],"env":{"NETLIFY_PERSONAL_ACCESS_TOKEN":"${NETLIFY_PERSONAL_ACCESS_TOKEN}"}}'`
- Gemini CLI: `gemini mcp add netlify -e 'NETLIFY_PERSONAL_ACCESS_TOKEN=${NETLIFY_PERSONAL_ACCESS_TOKEN}' npx -y @netlify/mcp@1.15.1`
- Codex: `codex mcp add netlify --env "NETLIFY_PERSONAL_ACCESS_TOKEN=${NETLIFY_PERSONAL_ACCESS_TOKEN}" -- npx -y @netlify/mcp@1.15.1`

`codex mcp add --env` stores the value the shell expanded, so the key is
written in plain text to `~/.codex/config.toml`; to keep only its name there,
add the server by hand with `env_vars = ["NETLIFY_PERSONAL_ACCESS_TOKEN"]`
instead of `env`, and Codex forwards the variable from your environment when
it starts the server.

Netlify tokens are not scoped: a personal access token reaches everything your
account reaches. Set an expiry on it. **The agent never enters a token or signs
in for you.**

## Install

**claude-code**

```bash
claude mcp add-json netlify '{"command":"npx","args":["-y","@netlify/mcp@1.15.1"]}'
```

**codex**

```bash
codex mcp add netlify -- npx -y @netlify/mcp@1.15.1
```

**gemini-cli**

```bash
gemini mcp add netlify npx -y @netlify/mcp@1.15.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Netlify documents `claude mcp add netlify -- npx -y @netlify/mcp` and
`codex mcp add netlify -- npx -y @netlify/mcp` for a local server, both
unpinned; the commands above pin the version. Netlify's first recommendation
is its **hosted** server, `https://netlify-mcp.netlify.app/mcp`, added with
`claude mcp add --transport http netlify <url>` or `codex mcp add netlify --url <url>`
and signed in to through OAuth. It is a separate way to reach the same tools,
it cannot be pinned, and it is not what this recipe installs.

## Before you install it

**It deploys, and it uploads more than you might expect.** `deploy-site` zips
the folder the agent names and uploads it to Netlify to build. It leaves out
`node_modules`, `.git`, `.netlify`, `coverage`, `tmp` and a file called
exactly `.env` — and nothing else. It does not read `.gitignore`: `.env.local`,
`.env.production`, key files and anything else in that folder are uploaded.
The tool has no draft option, so treat every call as a deploy of the project
unless you have locked production auto-publishing for it. Keep your agent's
per-tool approval on for `deploy-site`, and deploy from a clean folder.

**It changes production settings.** Environment variables and secrets can be
created, overwritten and deleted in the `production` context, and visitor
access controls can be removed. These take effect on the next build or
immediately, for everyone. Approve each write tool call yourself.

**It can delete data.** Form submissions deleted through
`manage-form-submissions` do not come back.

**Your login, the whole account.** There is no read-only mode and no project
scope. The server acts with the token it finds, and every team that token can
reach is in reach of the agent.

**What leaves the machine.** API calls go to `api.netlify.com` and
`api.netlifysdk.com`, coding guidance is fetched from `docs.netlify.com`, and
deploys upload the zipped folder. The package sends no usage telemetry of its
own; it writes a debug log only if `~/Desktop/netlify/netlify-mcp/log.txt`
already exists.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
