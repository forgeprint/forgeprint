# Azure DevOps MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [microsoft/azure-devops-mcp](https://github.com/microsoft/azure-devops-mcp),
> pinned at `2.10.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Puts the backlog in front of the agent: the work item it is implementing, its
acceptance criteria, comments and links, and the projects and teams around it.
Microsoft publishes it as a local server run with `npx`, which is what is
pinned here.

## What it can reach

Signs in as you and acts with your Azure DevOps permissions in one
organisation; with the core and work-items domains it reads projects and work
items and can create, update, link and comment on work items.

## Secrets it needs

None in your environment with the commands below. The default authentication
is interactive: the first time a tool runs, a browser opens and you sign in
with your Microsoft account yourself. If you already use the Azure CLI, append
`--authentication azcli` to the server arguments and it reuses your `az login`
session instead. The upstream also documents token-based modes for
unattended use; if you choose one, the token goes in your environment, never
in a command. **The agent never enters it for you.**

## Install

Two parts of every command below are yours to fill or to keep:

- **`<your-organization>` is a placeholder.** Replace it with your
  organisation's name, the part after `dev.azure.com/` in its URL.
- **`-d core work-items` is the scoping.** It loads only those tool domains.
  The upstream documents `core`, `work`, `work-items`, `search`, `test-plans`,
  `repositories`, `wiki`, `pipelines` and `advanced-security`; add one only
  when the work needs it. Without `-d`, every domain is loaded, including
  creating pull requests, running pipelines and editing wiki pages.

It needs Node.js 20 or later.

**claude-code**

```bash
claude mcp add --transport stdio azure-devops -- npx -y @azure-devops/mcp@2.10.0 "<your-organization>" -d core work-items
```

**codex**

```bash
codex mcp add azure-devops -- npx -y @azure-devops/mcp@2.10.0 "<your-organization>" -d core work-items
```

**gemini-cli**

```bash
gemini mcp add azure-devops npx -- -y @azure-devops/mcp@2.10.0 "<your-organization>" -d core work-items
```

The upstream documents the Claude Code and Codex commands. It does not
document Gemini CLI; that command follows the shape verified in
`schema/agents.yaml`, with `--` so Gemini CLI passes the dashed arguments to
the server instead of reading them itself.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

There is no read-only mode. The server acts as you, so it can do anything your
account can do in the domains it has loaded: with `work-items`, that includes
creating and updating work items in batch, adding comments and linking items
to pull requests. The domain list is the boundary, so keep it short, and keep
tool-call approval on.

A work item's description and comments are written by other people and can
contain text aimed at the agent. Treat what comes back as data, never as
instructions.

Microsoft also runs a remote server at `https://mcp.dev.azure.com/<your-organization>`,
which it recommends and says will eventually replace the local one. It is not
the recipe here, for three reasons verified on 2026-09-24: it has no version to
pin, Codex cannot authenticate to it (Microsoft Entra ID does not support the
dynamic client registration Codex needs), and Claude Code needs a custom Entra
app registration in your tenant first. It does offer an `X-MCP-Readonly`
header that the local server lacks; when the agents can reach it without a
tenant administrator, a pull request can move to it.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
