# MobileBuildMCP (formerly XcodeBuildMCP)

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [getsentry/MobileBuildMCP](https://github.com/getsentry/MobileBuildMCP),
> pinned at `2.7.1` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Gives an agent the Apple build loop without guessing `xcodebuild` flags: find the project and its schemes, build for a simulator, install and launch the app, run the tests, read coverage, take a screenshot and an accessibility snapshot of the running app. Structured results instead of pages of build log.

**macOS only.** It needs macOS 14.5 or later and Xcode 16 or later, and it does nothing useful anywhere else. Node.js 18 or later runs the package.

**Renamed.** Until 2.7.0 this project was XcodeBuildMCP (`xcodebuildmcp` on npm). From 2.7.1, published on 2026-09-23, it is MobileBuildMCP: the package is `mobilebuildmcp`, the environment variables are `MOBILEBUILDMCP_*`, and the project config lives in `.mobilebuildmcp/config.yaml`. The upstream's documentation pages still show the old names in places.

**Tool groups.** Tools come in workflows, and only two are on by default:

- `simulator` — `list_sims`, `boot_sim`, `open_sim`, `build_sim`, `build_run_sim`, `test_sim`, `install_app_sim`, `launch_app_sim`, `stop_app_sim`, `record_sim_video`, `clean`, `screenshot`, `snapshot_ui`, coverage and project-discovery tools.
- `session-management` — the defaults the other tools use (project path, scheme, simulator).

The others are off until enabled: `device` (build, install and launch on a physical iPhone, iPad, Watch, TV or Vision Pro), `macos`, `swift-package` (including `swift_package_run`), `ui-automation` (tap, swipe, type), `simulator-management` (including `erase_sims`), `debugging` (LLDB, including `debug_lldb_command`), `project-scaffolding`, `xcode-ide` (a bridge to Xcode's own tools), `coverage`, `utilities` and `doctor`. Enable them with `MOBILEBUILDMCP_ENABLED_WORKFLOWS` or `enabledWorkflows` in `.mobilebuildmcp/config.yaml`.

## What it can reach

Runs xcodebuild on the project it is pointed at, which runs the project's build scripts and Swift macros, and boots, installs, launches and records on simulators; more tool groups, including device installs and an LLDB console, can be switched on.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json mobilebuildmcp '{"command":"npx","args":["-y","mobilebuildmcp@2.7.1","mcp"],"env":{"MOBILEBUILDMCP_SENTRY_DISABLED":"true"}}'
```

**codex**

```bash
codex mcp add mobilebuildmcp --env "MOBILEBUILDMCP_SENTRY_DISABLED=true" -- npx -y mobilebuildmcp@2.7.1 mcp
```

**gemini-cli**

```bash
gemini mcp add mobilebuildmcp -e "MOBILEBUILDMCP_SENTRY_DISABLED=true" npx -y mobilebuildmcp@2.7.1 mcp
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents `claude mcp add XcodeBuildMCP -- npx -y xcodebuildmcp@latest mcp`
and `codex mcp add XcodeBuildMCP -- npx -y xcodebuildmcp@latest mcp` under the
old name, and `npx -y mobilebuildmcp@latest mcp` for any client under the new
one. The commands above use the new package, pinned, with error reporting off.
Builds and tests can run longer than Codex's default tool timeout; upstream
suggests `tool_timeout_sec = 600` on the server's block in
`~/.codex/config.toml`.

## Before you install it

**Building runs the project's code.** `xcodebuild` runs the project's Run
Script build phases, Swift package build plugins and Swift macros. The
upstream also tells `xcodebuild` to skip macro validation, so a macro from a
package runs without Xcode's usual trust prompt. Point it only at projects you
would build yourself.

**A repository can widen the tool set.** `.mobilebuildmcp/config.yaml` in the
project takes precedence over the environment, so a cloned repository can
switch on workflows the commands above leave off — `debugging`, whose
`debug_lldb_command` runs arbitrary LLDB commands in the app, or `device`,
which installs onto a connected phone. Read that file in a repository you did
not write.

**What it changes.** Simulators are booted, apps installed and launched,
videos and screenshots written, derived data cleaned. With the `simulator-management`
workflow on, `erase_sims` wipes a simulator.

**Downloads.** With `project-scaffolding` on, new projects are made from
template archives downloaded from GitHub releases of the upstream's template
repositories, at the template version this release pins. With incremental
builds switched on, it downloads `xcodemake` from a pinned commit. Neither
happens with the defaults.

**Error reporting.** By default the server sends its own runtime errors to
Sentry — upstream says tool inputs, outputs, source code and build artifacts
are never included, and home paths are redacted. Every command above sets
`MOBILEBUILDMCP_SENTRY_DISABLED=true`, which the package checks before it
starts Sentry. The old `XCODEBUILDMCP_SENTRY_DISABLED`, still shown in parts
of the upstream docs, is not read by 2.7.1. The package also reads
`SENTRY_DSN`: without the opt-out, a `SENTRY_DSN` set in your shell for your
own app would receive this server's error reports.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
