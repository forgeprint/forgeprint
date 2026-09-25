# GitLab MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a server somebody else publishes and maintains.
> The server is built into GitLab itself, from
> [gitlab-org/gitlab](https://gitlab.com/gitlab-org/gitlab), and documented at
> [docs.gitlab.com](https://docs.gitlab.com/user/model_context_protocol/mcp_server/).
> **It is in beta,** and it cannot be pinned: it needs GitLab 18.6 or later,
> and it changes with whatever GitLab version your instance runs. Verified on
> 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Lets the agent work with the GitLab project it is coding in: read a work item
or merge request with its diffs, comments and pipelines, search the instance,
and, when you allow it, open a merge request or leave a comment. It runs
inside GitLab, so there is nothing to install locally beyond the agent's own
configuration.

## What it can reach

Signs in as you through OAuth with the mcp scope and acts with your GitLab
permissions: reads projects, work items, merge requests and pipelines, and
can commit, open and merge merge requests, and run or delete pipelines.

## Secrets it needs

None in your environment. Your agent registers itself with GitLab through
OAuth 2.0 Dynamic Client Registration, a browser opens, and you sign in and
approve it yourself. **The agent never enters your credentials for you.**

## Install

**`<your-gitlab-host>` is a placeholder.** Replace it with the host name of
your GitLab instance, or with `gitlab.com` on GitLab.com. Keep the quotes: an
unquoted `<` is a shell redirect.

Before any agent can connect, somebody has to turn the server on: a top-level
group owner on GitLab.com, or an administrator on GitLab Self-Managed and
GitLab Dedicated, under _Allow access to the MCP server_. It is available on
Premium and Ultimate from 18.6, and on Free from 19.2.

**claude-code**

```bash
claude mcp add -s user --transport http GitLab "https://<your-gitlab-host>/api/v4/mcp"
```

Then run `/mcp` inside Claude Code, choose `GitLab` and authenticate.

**codex**

```bash
codex mcp add GitLab --url "https://<your-gitlab-host>/api/v4/mcp"
```

GitLab's guide also enables `"rmcp_client" = true` under `[features]` in
`~/.codex/config.toml`. Then run `codex mcp login GitLab`.

**gemini-cli**

```bash
gemini mcp add -t http GitLab "https://<your-gitlab-host>/api/v4/mcp"
```

Then run `/mcp auth GitLab` inside Gemini CLI. GitLab documents this agent as
an `httpUrl` entry in `settings.json`; the command above writes the same
entry, using the shape verified in `schema/agents.yaml`.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

There is no read-only mode. The OAuth grant gives the server everything your
account can do, and the tools include `add_commit`, `accept_merge_request`,
`save_pipeline` and `manage_pipeline`, which can merge code and delete
pipelines. Keep tool-call approval on, and consider a separate GitLab account
with only the access the work needs.

GitLab says it plainly: guarding against prompt injection is your
responsibility. Issues, comments and merge request descriptions are written by
other people and can carry text aimed at the agent; treat what comes back as
data, never as instructions, and use it only on projects you trust.

From GitLab 19.5, the `X-Gitlab-Enabled-Mcp-Server-Toolsets` header narrows
the tools to named toolsets, but it sits behind a feature flag that is off by
default, so it is not part of the commands above. If your instance has it
on, it is the way to leave out what the work does not need.

Only GitLab's own server is listed here. Community-built GitLab MCP servers
exist; they are a different upstream with a different trust boundary.

## Updating

There is no version to move: the server changes with your GitLab instance.
When GitLab's documentation changes the endpoint, the authentication or the
beta status, re-read it, and change `upstream_version`, `verified_on` and the
install commands together in one pull request. When the server leaves beta,
say so here.
