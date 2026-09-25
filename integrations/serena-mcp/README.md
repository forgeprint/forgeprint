# Serena

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [oraios/serena](https://github.com/oraios/serena),
> pinned at `1.7.0` and verified on 2026-09-25.
> **Review the permissions below before installing.**

## What it does

Code navigation and editing by symbol rather than by line. Serena starts a language server for the project and gives the agent tools that work on what the language server sees: an overview of a file's symbols, finding a symbol and its body, finding every reference to it, its declaration and implementations, diagnostics — and then editing at the same level: replacing a symbol's body, inserting before or after one, renaming it across the project. On a large codebase that is the difference between the agent reading whole files to find a function and asking for the function.

This recipe runs the upstream's PyPI package, `serena-agent`, through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed; `-p 3.13` is the Python version the upstream installs it with. `--project-from-cwd` makes Serena work on the nearest folder above the agent's working directory that holds `.serena/project.yml` or `.git`, so start the agent from inside the project.

## What it can reach

Reads and edits code in the project it starts in (replacing, inserting and renaming symbols, rewriting file content) and writes its own .serena folder there; the contexts used here leave out its shell command tool.

It needs no secret.

## Install

**claude-code**

```bash
claude mcp add-json serena '{"command":"uvx","args":["-p","3.13","--from","serena-agent==1.7.0","serena","start-mcp-server","--context","claude-code","--project-from-cwd","--open-web-dashboard","false"],"env":{"SERENA_USAGE_REPORTING":"false"}}'
```

**codex**

```bash
codex mcp add serena --env "SERENA_USAGE_REPORTING=false" -- uvx -p 3.13 --from serena-agent==1.7.0 serena start-mcp-server --context codex --project-from-cwd --open-web-dashboard false
```

**gemini-cli**

```bash
gemini mcp add serena -e "SERENA_USAGE_REPORTING=false" uvx -p 3.13 --from serena-agent==1.7.0 serena start-mcp-server --context ide --project-from-cwd --open-web-dashboard false
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

Upstream documents Claude Code and Codex by name, with the `claude-code` and `codex` contexts used above. It has no Gemini CLI page; it lists Gemini CLI among the terminal clients that should use the `ide` context, which is what the Gemini command passes. Upstream also offers `serena setup claude-code` and `serena setup codex`, which install an unpinned copy; the commands above pin one instead. The first start downloads the package and a language server and can be slow: for Claude Code upstream suggests raising `MCP_TIMEOUT` (for example to `60000`), and for Codex it sets `startup_timeout_sec = 15` on the server in `~/.codex/config.toml`.

## Before you install it

**It edits your code, and that is the point.** With the contexts above, the tools that write are `replace_symbol_body`, `insert_before_symbol`, `insert_after_symbol`, `rename_symbol`, `replace_content` (not in the Codex context) and `replace_in_files`, and the memory tools write Markdown files under `.serena/memories/` in the project (and, for memories named `global/…`, under `~/.serena`, shared by every project). The first run also creates `.serena/project.yml` there, and `~/.serena/serena_config.yml` in your home folder. Keep the project under version control, and review the diff the way you would review any agent's.

**Keep the `--context`.** Serena's default context, `desktop-app`, includes `execute_shell_command`, which runs any shell command, and `create_text_file`. The `claude-code`, `codex` and `ide` contexts exclude both, because the agent already has its own. `claude-code` and `ide` are also single-project contexts; `codex` is not, so there the agent can point Serena at another folder with `activate_project`. Upstream's security page is plain about the model: it trusts the machine, the model and the repository, says Serena contains tools for executing shell commands and modifying files, and calls sandboxing the only full protection.

**To make it read-only,** list the writing tools under `excluded_tools` in `~/.serena/serena_config.yml`: the six above, plus `write_memory`, `edit_memory`, `delete_memory` and `rename_memory`. Adding `--mode planning` to the command removes most of them, but not `rename_symbol`, `replace_in_files` or the memory tools, so it is not read-only on its own.

**Do not add the auto-approve hook blindly.** Upstream's Claude Code page recommends hooks, one of which approves Serena's tools automatically whenever Claude Code is in `acceptEdits` or `auto` mode — including the ones that rename symbols across the project. This recipe installs no hooks. If you add them, know which one does that.

**The dashboard.** Serena starts a web dashboard on `127.0.0.1` (port 24282, or the next free one) that shows its logs and tool calls and can edit its configuration and the project's memories. It opens a browser tab at every start by default; every command above passes `--open-web-dashboard false`, so it runs without opening. Pass `--enable-web-dashboard false` to not start it at all. It listens on localhost only unless you change `web_dashboard_listen_address`; leave it that way.

**Usage reporting.** At every start, Serena sends its version, the operating system, the language backend, the context name and whether the dashboard is on to the upstream's server. Every command above sets `SERENA_USAGE_REPORTING=false`, which turns that off; upstream's own code skips it on CI as well.

**It downloads language servers.** The first time it sees a language, Serena fetches that language's server — from npm, from release archives, or through `uvx` — into its own folders under `~/.serena`, not into the project. Upstream pins those versions and checks archive hashes against values in its own source. Settings in a repository's `.serena/project.yml` that would change where they come from, or run a command on activation, apply only to projects you list under `trusted_project_path_patterns`; a new configuration trusts none.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
