# Git MCP

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [modelcontextprotocol/servers/tree/main/src/git](https://github.com/modelcontextprotocol/servers/tree/main/src/git),
> pinned at `2026.8.18` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Git as tools rather than as shell commands: `git_status`, the three diffs, `git_log` with date filters, `git_show` and `git_branch` to read, and `git_add`, `git_commit`, `git_reset`, `git_create_branch` and `git_checkout` to change the repository. It is for an agent or host that has no shell, or one whose shell access you would rather not grant; a coding agent that already runs `git` itself gains little from it.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed. Replace `/path/to/repo` with the repository the agent should work in.

It is one of the MCP steering group's reference servers. Upstream describes them as reference implementations and educational examples, not production-ready solutions, and the server's own README says it is in early development.

## What it can reach

Reads the history, diffs and working tree of the repository passed with --repository, and writes to it: stages files, commits, unstages, creates and switches branches. It does not push.

## Install

**claude-code**

```bash
claude mcp add-json git '{"command":"uvx","args":["mcp-server-git==2026.8.18","--repository","/path/to/repo"]}'
```

**codex**

```bash
codex mcp add git -- uvx mcp-server-git==2026.8.18 --repository /path/to/repo
```

**gemini-cli**

```bash
gemini mcp add git uvx mcp-server-git==2026.8.18 --repository /path/to/repo
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**Only `2026.8.18` or later.** Four advisories cover earlier versions of this package, all fixed by the pin:

| Advisory                                                            | What                                                                      | Fixed in   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| [CVE-2025-68143](https://github.com/advisories/GHSA-5cgr-j3jf-jw3v) | `git_init` could create a repository anywhere on the filesystem           | 2025.9.25  |
| [CVE-2025-68144](https://github.com/advisories/GHSA-9xwc-hfwc-8w59) | argument injection in `git_diff` and `git_checkout` could overwrite files | 2025.12.18 |
| [CVE-2025-68145](https://github.com/advisories/GHSA-j22h-9j4x-23w5) | `--repository` did not stop a tool call from naming another path          | 2025.12.18 |
| [CVE-2026-27735](https://github.com/advisories/GHSA-vjqx-cfc4-9h6v) | path traversal in `git_add` could stage files outside the repository      | 2026.1.14  |

Do not install an older version, and do not use the `mcp/git` Docker image, which was last updated before the 2025 fixes.

**`--repository` is the boundary; leave it in.** Every tool takes a `repo_path` argument. With `--repository`, the server refuses a path outside that repository. Without it, the server checks nothing, and any repository the user running it can read is in reach — including one whose history holds a secret somebody removed later.

**It writes.** It can stage, commit, unstage and move `HEAD` between branches. Commits are made under whatever author the repository's Git configuration names, so the history will say you wrote them, and the repository's commit hooks may run. It has no push, pull or remote tools, so nothing leaves the machine through this server; what the agent committed is still in the branch the next time you push. Review with `git log` before you do.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
