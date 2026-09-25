# Mobile MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [mobile-next/mobile-mcp](https://github.com/mobile-next/mobile-mcp),
> pinned at `1.0.5` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Lets the agent use a phone the way a tester would: see what is on the screen, tap, swipe, type, launch and install the app, and read the logs and crash reports when something goes wrong. It works from the platform's accessibility tree first and falls back to screenshots and coordinates, and the same tools work on iOS and Android, on simulators, emulators and real devices.

**What it needs on the machine.** Nothing here runs without a device to drive:

- **iOS simulators** — macOS with Xcode and a booted simulator (`xcrun simctl boot …`).
- **iOS real devices** — macOS with Xcode and the device connected over USB and trusted; upstream's wiki covers the extra setup a real iPhone needs.
- **Android emulators and devices** — the Android SDK (`adb`, found through `ANDROID_HOME`) and a running emulator, or a device with USB debugging enabled and authorised. This works on Linux, macOS and Windows.
- Node.js 20 or later. The package brings a native `mobilecli` binary for the platform through its npm dependencies.

The tools, from the upstream README and the published `1.0.5` package:

- **Devices** — list devices, screen size, orientation (get and set), GPS location override, clipboard (read and replace).
- **Apps** — list, get the foreground app, launch, terminate, **install** (`.apk`, `.ipa`, `.app`, `.zip`) and **uninstall**.
- **Screen** — screenshots (to the agent, or saved to a file), the list of on-screen elements, tap, double-tap, long press, swipe, screen recording to a video file.
- **Input** — type text, press hardware buttons, open a URL in the device browser.
- **Logs** — live device logs (logcat, or the iOS unified log), crash reports.
- **`mobile_batch_commands`** — several of the above in one call.
- **Mobile Next Cloud** — sign in to Mobile Next's device cloud, list, reserve and release remote devices.

## What it can reach

Controls every simulator, emulator and USB-connected device on the machine: reads the screen, taps, types, installs and uninstalls apps, opens URLs, reads device logs and crash reports, and writes screenshots and recordings to disk.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json mobile-mcp '{"command":"npx","args":["-y","@mobilenext/mobile-mcp@1.0.5"],"env":{"MOBILEMCP_DISABLE_TELEMETRY":"1"}}'
```

**codex**

```bash
codex mcp add mobile-mcp --env "MOBILEMCP_DISABLE_TELEMETRY=1" -- npx -y @mobilenext/mobile-mcp@1.0.5
```

**gemini-cli**

```bash
gemini mcp add mobile-mcp -e "MOBILEMCP_DISABLE_TELEMETRY=1" npx -y @mobilenext/mobile-mcp@1.0.5
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents `claude mcp add mobile-mcp -- npx -y @mobilenext/mobile-mcp@latest`,
`codex mcp add mobile-mcp npx "@mobilenext/mobile-mcp@latest"` and
`gemini mcp add mobile-mcp npx -y @mobilenext/mobile-mcp@latest`. The commands
above pin the version and turn telemetry off.

## Before you install it

**It acts on whatever device is connected.** The agent picks a device from
everything the machine can see — including your own phone if it is plugged in
with debugging on. It can install and uninstall apps, type into any field,
replace the clipboard and change the location the device reports. Use a
simulator, an emulator or a test device, and unplug the phone you use every
day.

**What it reads can be personal.** Screenshots, the on-screen element list,
the clipboard and device logs show whatever the device holds — messages,
notifications, account names, tokens an app logged. On a real device, all of
it goes to the agent's model.

**It writes files where the agent says.** Saved screenshots, screen
recordings and saved logs go to paths the agent chooses.

**URLs.** `mobile_open_url` opens links in the device browser. Non-standard URL
schemes are blocked unless `MOBILEMCP_ALLOW_UNSAFE_URLS=1` is set; leave it
unset.

**The cloud tools can cost money.** `mobile_login_to_cloud_provider` starts a
browser sign-in to Mobile Next Cloud, and `mobile_allocate_remote_device`
reserves a physical device there — upstream describes it as a shared, billed
resource. Nothing is reserved unless you sign in; decline the sign-in if you
did not ask for a cloud device.

**Telemetry.** By default the server sends an event to PostHog at launch and
for every tool call (tool name, duration, platform, Node version, the agent's
name, and a hash of the host name) and a Scarf pixel once per process. Every
command above sets `MOBILEMCP_DISABLE_TELEMETRY=1`, which the package checks
before sending either.

**Streamable HTTP mode.** `--listen <port>` serves the tools over HTTP instead
of stdio. The commands above do not use it; if you do, set `MOBILEMCP_AUTH` so
the endpoint requires a bearer token, and do not expose it beyond the machine.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
