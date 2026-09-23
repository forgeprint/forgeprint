# 13. Agent-agnostic: one source, many outputs, and a registry that has to be re-read

- Status: Accepted
- Date: 2026-09-23
- Deciders: core maintainer
- Extends: CLAUDE.md §1 (what Forgeprint is)
- Constrained by: [ADR 0001](0001-no-variants.md) (no variants),
  [ADR 0006](0006-skill-distribution.md) (skill distribution)

## Context

Forgeprint was built in Claude Code, its commands are exercised there, and its
own repository instructions live in a `CLAUDE.md`. None of that is a reason for
the catalog to be a Claude Code product, and the catalog has never claimed to
be one — `agents` has been a manifest field since the first schema.

But a field is not a capability. Every blueprint so far ships an `AGENTS.md`
and nothing else, and what an agent actually reads varies more than the shared
filename suggests:

- Cursor reads `.cursor/rules/*.mdc`, and a rule file without YAML frontmatter
  is ignored entirely.
- Gemini CLI reads `GEMINI.md` by default; `AGENTS.md` works only if somebody
  adds it to the `context.fileName` setting.
- Windsurf caps a workspace rule file at 12,000 characters, silently.
- Copilot CLI reads `.github/copilot-instructions.md`.
- Claude Code reads `AGENTS.md` directly — but only when no `CLAUDE.md` exists
  at or above the working directory.

A catalog that ships one file and says "works with five agents" is guessing
about four of them. There are two ways to stop guessing: write a copy per
agent, which is the variant problem ADR 0001 exists to refuse, or write once
and render.

The second problem is that none of the above will still be true in a year. Two
of these agents changed their documented configuration path while this decision
was being written.

## Decision

**1. Forgeprint is agent-agnostic. Claude Code is the first verified client,
not the target.** This goes in CLAUDE.md §1 and in the README's positioning.
Tool descriptions in the MCP server name no agent; `_meta` hints stay inside
the general MCP contract.

**2. `schema/agents.yaml` is the registry, and nothing in it is written from
memory.** One entry per agent: MCP transports, the context files it reads in
preference order, its skill format if it has one, the command that installs an
MCP server, how it receives secrets, whether it can be driven headlessly and
with what command, its limits, the vendor documentation URL, and the date that
URL was last read.

A field nobody has verified is `null`. `null` reads as "not established"; a
guess reads as a fact, and a fact is what a contributor will act on.

**3. The `agents` vocabulary derives from the registry.** `forgeprint validate`
refuses the two lists to drift in either direction: an id in the registry that
the vocabulary does not know, or a vocabulary value with no entry behind it.
Adding an agent means adding a verified entry, not a line in the taxonomy.

**4. An entry goes stale after 90 days.** The same interval
`docs/review-standards.md` uses, for the same reason. Staleness is a **warning**,
not an error: an entry ageing out is a fact about the calendar, not a defect in
whichever pull request happens to be open, and failing an unrelated contributor
over it would teach everybody to ignore a red build.

**5. One source, many outputs.** Blueprint, expert and crew content is written
once, as `AGENTS.md` and `SKILL.md`. Agent-specific files are **generated** —
`forgeprint render --agent cursor` writes `.cursor/rules/`, `--agent gemini-cli`
writes `GEMINI.md`, `--agent copilot-cli` writes
`.github/copilot-instructions.md`. A hand-written agent-specific copy is
refused; that is ADR 0001 applied to the same content in a second costume.

**6. `agents[]` in a manifest means tested, not supported.** A contributor adds
only the agent they verified, and `/review-pr` asks for evidence. A small pull
request type, `agent-verification`, exists for "I tested this one too". The
site shows a badge per agent: green for tested, grey for unknown — never a
third colour implying it probably works.

**7. There is a path for agents with no MCP client.** `npx forgeprint get <slug>
--agent <id>` writes the same output to files. An agent that cannot speak MCP
is not excluded from the catalog; it just gets it through the CLI.

## Consequences

- Nine agents are registered at this decision: Claude Code, Cline, Codex CLI,
  GitHub Copilot CLI, Cursor, Gemini CLI, Kiro, OpenCode and Windsurf. Five of
  them can be driven headlessly, which is what decides whether the `setup-test`
  matrix can cover them automatically or whether a person has to record a
  manual verification with a date.
- Two of the nine currently ship skills in the `SKILL.md` format, which is what
  makes ADR 0006's bet — write to the spec, let the distributors distribute —
  worth more than it was when it was made.
- `render` has to be written, and every agent added later costs a renderer.
  That is the price of not shipping copies, and it is the cheaper half.
- The registry is a maintenance obligation with a clock on it. That is
  deliberate: a registry without an expiry is a document that quietly becomes
  wrong, and a wrong install command is worse than a missing one.
- Two entries already carry a note that the vendor's documentation moved. That
  is the mechanism working, not a defect in it.

## Alternatives considered

**Ship `AGENTS.md` and let each agent cope.** The status quo, and defensible:
every agent registered here reads `AGENTS.md` in some form. Rejected because
"in some form" is doing the work — Gemini CLI needs a setting changed, Claude
Code needs no `CLAUDE.md` present, Windsurf truncates at 12,000 characters. A
catalog whose promise is a deterministic setup cannot hand over a file and hope.

**Hand-written per-agent files in each blueprint.** Rejected: it is ADR 0001
with extra steps. Seventeen blueprints times nine agents is 153 files that
drift the first time somebody edits one of them.

**A registry without an expiry date.** Simpler and quietly wrong: the whole
reason this file exists is that vendor documentation moves, and two entries
proved it during the week it was written.

**Verifying every agent before registering it.** Attractive and unaffordable:
four of the nine have no headless mode, so verification is a person sitting at
an editor. Registering what the vendor documents, marking what has been tested
separately, and never conflating the two is the honest version.
