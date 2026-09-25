# Storybook MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [storybookjs/storybook](https://github.com/storybookjs/storybook)
> (the addon lives in `code/addons/mcp`), pinned at `10.6.0` and verified on
> 2026-09-24.
> **Review the permissions below before installing.**

## What it does

An addon that turns a project's own Storybook into an MCP server. The agent
can list your components, read their props and stories, find the stories a
changed file affects, preview them, and run their tests, so the UI it writes
uses the components you already have rather than inventing new ones. Storybook
labels its AI capabilities as a preview whose API may change.

## What it can reach

Serves from your local Storybook dev server with no credentials: reads
component docs and stories, runs story tests through Vitest when that addon is
installed, and publishes a review of your current changes to its own review page.

## Install

Each command below does two things, joined by `&&`:

1. `npx storybook add @storybook/addon-mcp@10.6.0` installs the addon into the
   project and registers it in `.storybook/main.*`. Run it at the project
   root, in a project that already uses Storybook 10.6 or later (the addon's
   peer dependency). Note that `storybook add` writes the dependency as a
   range, `^10.6.0`, unless it matches your Storybook version exactly, so your
   lockfile is what holds the pin.
2. The agent command registers `http://localhost:6006/mcp`, the addon's
   default endpoint on Storybook's default port. If your Storybook runs on a
   different port, change the URL.

The server only exists while Storybook's dev server is running
(`npm run storybook`, or however your project starts it).

**claude-code**

```bash
npx storybook add @storybook/addon-mcp@10.6.0 && claude mcp add-json storybook '{"type":"http","url":"http://localhost:6006/mcp"}'
```

**codex**

```bash
npx storybook add @storybook/addon-mcp@10.6.0 && codex mcp add storybook --url http://localhost:6006/mcp
```

**gemini-cli**

```bash
npx storybook add @storybook/addon-mcp@10.6.0 && gemini mcp add -t http storybook http://localhost:6006/mcp
```

Storybook documents the install command and the URL, and for connecting an
agent says to follow the agent's own documentation. The registration halves
above are therefore not Storybook's: Claude Code and Gemini CLI use the shapes
verified in `schema/agents.yaml`, and Codex uses its `mcp add --url`
argument, read from Codex's source on 2026-09-24.

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

The endpoint asks for no credentials: the addon's request handler checks no
token and no origin, so whatever can reach the dev server's port can call its
tools. Check which interface your Storybook dev server listens on, and do
not expose that port beyond your own machine while the addon is installed.

`test-run` executes your story tests, which is running your code; it is only
available when `@storybook/addon-vitest` is installed. If you want the agent
to read but not run anything, turn toolsets off in the addon's options in
`.storybook/main.*`, for example
`{ name: '@storybook/addon-mcp', options: { toolsets: { test: false } } }`.
The toolsets are `dev`, `docs` and `test`, all on by default; `docs` needs
a framework with components-manifest support (React, Angular with Vite, Vue 3
with Vite).

Storybook collects telemetry, and the addon reports MCP sessions through it.
Turn it off with `core: { disableTelemetry: true }` in `.storybook/main.*`, or
with `STORYBOOK_DISABLE_TELEMETRY=true`.

The addon's download count is not a measure of deliberate use: Storybook's
own upgrade command adds it automatically when it detects that an AI agent is
running the upgrade.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request. The addon moves with Storybook itself,
so the pin should follow the Storybook version the recipe is tested against.
