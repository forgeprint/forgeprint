# Terraform MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [hashicorp/terraform-mcp-server](https://github.com/hashicorp/terraform-mcp-server),
> pinned at `1.3.0` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Lets the agent look a provider or module up instead of remembering it: resource arguments, the latest provider and module versions, and Sentinel policies, read from the public Terraform Registry. HCL written against the schema that exists today rather than the one in the model's training data.

It runs as the upstream's Docker image, so Docker has to be installed and running.

## What it can reach

Runs a container on this machine that reads public provider, module and policy documentation from the Terraform Registry; with no token set it reaches no workspace, state or run.

## Secrets it needs

None for this recipe. The commands enable only the `registry` toolset, which reads the public registry and needs no credentials.

`TFE_TOKEN` (with `TFE_ADDRESS`) is optional upstream, and only matters if you turn on the HCP Terraform or Terraform Enterprise toolsets — see below before you do.

## Install

**claude-code**

```bash
claude mcp add-json terraform '{"command":"docker","args":["run","-i","--rm","hashicorp/terraform-mcp-server:1.3.0","--toolsets=registry"]}'
```

**codex**

```bash
codex mcp add terraform -- docker run -i --rm hashicorp/terraform-mcp-server:1.3.0 --toolsets=registry
```

**gemini-cli**

```bash
gemini mcp add terraform docker run -i --rm hashicorp/terraform-mcp-server:1.3.0 --toolsets=registry
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**The registry toolset is the default, and the commands name it anyway.** `registry` is what `1.3.0` enables when no toolset is given; passing `--toolsets=registry` keeps it that way if a later release widens the default.

**A token turns this into something else.** With `TFE_TOKEN` and `--toolsets=terraform`, the server can create and update workspaces, projects, teams, variables and variable sets in HCP Terraform or Terraform Enterprise, and queue runs. Deleting a workspace, project or team, force-unlocking a workspace, and acting on a run are registered only when `ENABLE_TF_OPERATIONS=true` as well. That is write access to infrastructure. If you need the private registry only, `--toolsets=registry,registry-private` with a token scoped to one organisation reads modules and providers without the workspace tools. Pass a token into the container with `-e TFE_TOKEN` (the name only, so Docker reads the value from your environment), never as a value on the command line.

**A tag is not a digest.** `1.3.0` can in principle be pushed again. If that matters to you, pin the image by digest as well: `hashicorp/terraform-mcp-server:1.3.0@sha256:423a6b8e2ee06affcf090892f40c86469caba45fd2448ffa8ca5d717a174f7d5`, the multi-platform digest Docker Hub listed for `1.3.0` on 2026-09-24.

The image runs as a non-root user. What the agent reads here is public documentation; the upstream's own note still applies, that outputs vary by model and should be reviewed before they become infrastructure.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
