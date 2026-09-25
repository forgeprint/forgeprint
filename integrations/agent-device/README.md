# agent-device

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [callstack/agent-device](https://github.com/callstack/agent-device),
> pinned at `0.21.14` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Callstack's tool for giving a coding agent a live feedback loop on a mobile app. The agent opens the app, reads the screen as an accessibility snapshot with references it can act on, taps and types, and checks the result — then keeps the evidence: screenshots, video, logs, traces, network requests, performance samples and crash details. Working steps can be saved as `.ad` replay scripts, or exported as Maestro YAML, and run again in CI. It is CLI-first: the same runtime is a command-line tool, a Node.js API and, with `agent-device mcp`, the MCP server this recipe installs. React Native and Expo apps get extra helpers (Metro, component trees, re-render profiles).

**What it needs on the machine.**

- Node.js **22.12 or later** (web automation needs Node.js 24 and a separate setup step from the terminal).
- **iOS and tvOS** — macOS with Xcode. The first iOS session builds a small XCUITest runner with Xcode; a real device also needs signing.
- **Android and Android TV** — the Android SDK (`adb`) and a running emulator, or a device with USB debugging on. This works on Linux, macOS and Windows.
- HarmonyOS, macOS desktop apps and Linux desktop apps are supported targets as well, each with its own tools.

Run `npx -y agent-device@0.21.14 doctor` in a terminal first; upstream asks for this before an agent gets the server.

**The tools.** `tools/list` on the pinned version returns 59 tools, one per CLI command. Those that change something:

- **Devices** — `boot`, `shutdown`, `orientation`, `fold`, `settings` (OS settings, animation scales, appearance, **app permissions**), `clipboard` (read or replace).
- **Apps** — `open` (apps, deep links, URLs), `close`, `install`, `reinstall`, `install-from-source` (builds from URLs or CI artifacts, through a remote daemon), `push` (delivers push notifications), `trigger-app-event`, `metro` (prepares or reloads a React Native dev server).
- **Input** — `click`, `press`, `longpress`, `fill`, `type`, `gesture`, `swipe`, `scroll`, `focus`, `hover`, `back`, `home`, `keyboard`, `alert` (accept or dismiss), hardware and TV-remote buttons.
- **Runs** — `batch`, `replay` and `test` run saved scripts; `record` and `trace` write video and trace files.

The rest read: `devices`, `apps`, `appstate`, `snapshot`, `screenshot`, `get`, `is`, `find`, `diff`, `logs`, `network`, `perf`, `events`, `artifacts`, `capabilities`, `doctor`, `help` and a few more. None of the 59 carries a read-only or destructive annotation, so an agent's approval prompt cannot tell them apart for you.

## What it can reach

Controls the simulators, emulators and connected devices on the machine: boots and shuts them down, installs and removes apps, taps and types, changes OS settings and app permissions, sends push notifications, and reads screens, logs and app network traffic.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json agent-device '{"command":"npx","args":["-y","agent-device@0.21.14","mcp"],"env":{"AGENT_DEVICE_NO_UPDATE_NOTIFIER":"1"}}'
```

**codex**

```bash
codex mcp add agent-device --env "AGENT_DEVICE_NO_UPDATE_NOTIFIER=1" -- npx -y agent-device@0.21.14 mcp
```

**gemini-cli**

```bash
gemini mcp add agent-device -e "AGENT_DEVICE_NO_UPDATE_NOTIFIER=1" npx -y agent-device@0.21.14 mcp
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents two MCP entries: `"command": "agent-device", "args": ["mcp"]`
after a global `npm install -g agent-device@latest`, and, for unattended agent
use, `"command": "npx", "args": ["-y", "agent-device@<reviewed-version>", "mcp"]`.
The commands above are the second form with the reviewed version filled in.
Upstream also suggests the plain CLI plus a project rule instead of MCP when
you want every command visible in the terminal.

## Before you install it

**It acts on whatever device it selects.** A plugged-in phone with debugging
on is a device it can choose. It can install and remove apps, grant or revoke
app permissions, replace the clipboard and send push notifications. Use a
simulator, an emulator or a test device.

**What it reads can be personal or secret.** Screenshots, snapshots, device
logs and the `network` tool — which reads recent HTTP(S) traffic from the
app's log, headers included where the app logs them — carry whatever the app
and the device hold. All of it goes to the agent's model. Upstream offers
`AGENT_DEVICE_APP_LOG_REDACT_PATTERNS` for redacting app logs.

**It keeps state and runs in the background.** Sessions run through a local
daemon, and state, caches and artifacts are kept under `~/.agent-device`.
Replay scripts and recordings are written where the agent says.

**Cloud devices are opt-in.** The package can route sessions to cloud device
providers (agent-device's own cloud, BrowserStack, AWS Device Farm, Limrun)
and `install-from-source` can fetch builds through a remote daemon, but only
when you configure them with their own settings and credentials. The commands
above configure none.

**Update check.** When it runs in a terminal, the CLI asks the npm registry at
most every 14 days whether a newer version exists. It sends nothing else; every
command above sets `AGENT_DEVICE_NO_UPDATE_NOTIFIER=1`, which skips it. No
usage telemetry was found in the package.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
