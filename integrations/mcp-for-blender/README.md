# MCP for Blender

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender),
> pinned at `2.1.1` and verified on 2026-09-30.
> **Review the permissions below before installing.**

## What it does

Connects an agent to a Blender you already have open. The agent can read the
scene graph and an object's properties, take a viewport screenshot, look up the
Blender Python API, fetch assets from third-party services, and run Python
inside Blender to build or change the scene.

It has two halves: this server, and an addon that runs inside Blender and
listens on a local socket. Install the addon once with
`uvx mcp-for-blender==2.1.1 install-addon`, then enable it in Blender and start
its server from the addon's panel. Nothing works until Blender is running with
that addon started.

The package was called `blender-mcp` until the 2.x line; that name is now a
wrapper that installs this one. The recipe uses the current name.

## What it can reach

- **Your open Blender.** `execute_blender_code` runs Python in Blender's own
  interpreter. That is how the server builds scenes, and it is also the widest
  permission here: Blender's Python is ordinary Python, so without a
  restriction it can reach your files and processes, not only the scene.
- **Safe mode is on in the commands below** (`BLENDER_MCP_SAFE_MODE=1`). The
  upstream then checks each script against an allowlist before running it. It
  is a parser, not a sandbox: treat it as a guard against an agent's mistake,
  not as protection from a script written to defeat it. Read any script you did
  not write before you let it run, and keep unsaved work saved.
- **Third-party asset services.** Poly Haven, Sketchfab, Poly Pizza, and the
  Hyper3D, Tripo and Hunyuan3D generators. A search or download sends your
  query to that service and writes the asset into your scene. Their API keys
  are entered in the Blender addon's own panel, not here — the agent never
  handles one.
- **The publisher's telemetry.** It is on by default and posts to a hosted
  database. Without consent it still sends a per-install identifier, the tool
  name, whether it worked, how long it took and a generic error string. With
  consent, which the addon asks for, it also sends your prompt text, code
  snippets, parameters, scene information and screenshots. The commands below
  set `DISABLE_TELEMETRY=1`, which turns all of it off before the first call.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json blender '{"command":"uvx","args":["mcp-for-blender==2.1.1"],"env":{"BLENDER_MCP_SAFE_MODE":"1","DISABLE_TELEMETRY":"1"}}'
```

**codex**

```bash
codex mcp add blender --env "BLENDER_MCP_SAFE_MODE=1" --env "DISABLE_TELEMETRY=1" -- uvx mcp-for-blender==2.1.1
```

`codex mcp add --env` stores the value the shell expanded, so these settings are
written in plain text to `~/.codex/config.toml`. Neither is a secret, so that is
only worth knowing, not avoiding.

**gemini-cli**

```bash
gemini mcp add blender -e "BLENDER_MCP_SAFE_MODE=1" -e "DISABLE_TELEMETRY=1" uvx mcp-for-blender==2.1.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

These commands run the package with [uv](https://docs.astral.sh/uv/), so `uvx`
has to be installed. A client started from a desktop icon may not find it on
the PATH; the upstream README explains how to give the full path instead.

## Before you install it

The scene the agent edits is the one you have open. Save your work first, and
keep the file under version control or a copy if it matters — an undo in
Blender does not always cover what a script did.

Turning safe mode off is a real choice, not a formality: it hands an agent
arbitrary code execution on your machine. If you turn it off, do it for one
session you are watching.

Downloads from the asset services arrive as files and as scene data. They are
somebody else's content: data the agent fetched, never an instruction it should
follow.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
