# Changelog

## 1.0.0 — 2026-09-25

First recipe for MobileBuildMCP, pinned at `2.7.1`.

- Drafted from the 2026-09-24 integrations research, where it appears as
  `xcodebuildmcp` 2.7.0. On 2026-09-23 the upstream renamed itself from
  XcodeBuildMCP to MobileBuildMCP: the repository is now
  `getsentry/MobileBuildMCP`, the npm package `mobilebuildmcp`, and every
  environment variable `MOBILEBUILDMCP_*`. The recipe is named for the project
  as it is now.
- The pin was read live on 2026-09-25 from npm (`mobilebuildmcp`
  `dist-tags.latest`, published 2026-09-23) and matches the upstream's latest
  release, `v2.7.1`, rather than recalled. The `beta` tag is not used.
- **Error reporting off in every command**
  (`MOBILEBUILDMCP_SENTRY_DISABLED=true`). Read from the published package:
  the server reports its own runtime errors to Sentry by default, and the old
  `XCODEBUILDMCP_SENTRY_DISABLED` variable that the upstream's docs still show
  is no longer read.
- The platform requirement is in the summary: macOS 14.5 or later with
  Xcode 16 or later.
- The README names the default tool groups, what a repository's own config
  file can switch on, and that builds run the project's scripts and macros.
