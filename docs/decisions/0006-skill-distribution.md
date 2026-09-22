# 6. Skills are distributed by the standard tools, and checked against them

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Implements: CLAUDE.md §2, fourth differentiator ("installable via `npx skills
  add` and `gh skills install` as well")

## Context

Forgeprint delivers skills two ways. The MCP server returns them with a
blueprint, which is the path the product is built around. The other is that a
repository of skills is already installable by tools nobody here controls:

- `npx skills add <owner/repo>` (the `skills` CLI, `skills.sh`)
- `gh skill install <owner/repo> <skill>` — `gh skills` is an alias, so the
  form written in the kickoff also works

Being compatible with them is a claim in the README. A claim like that decays
silently: a frontmatter field is renamed, a skill is moved, and nothing in this
repository notices because neither tool runs here.

## Decision

**Follow their conventions exactly; invent nothing.** Skills live at
`<something>/skills/<name>/SKILL.md`, the name in the frontmatter equals the
directory name, and the frontmatter carries `name` and `description` in the
form both tools read (rule 6).

**Check the format in `validate`.** `forgeprint validate` fails on a skill that
would not install: missing or unparseable frontmatter, a name that does not
match its folder or the naming rules, a missing description, `allowed-tools` as
a list rather than a string, install metadata (`metadata.github-*`) committed
back into a source file, or two skills sharing a name — a name addresses one
skill.

The check is offline and deterministic, because `validate` has to pass on a
laptop with no network (ADR 0002). It is a re-implementation of somebody else's
rules, which is exactly why the next point exists.

**`license` is required here, though both tools only recommend it.** A skill is
copied into another repository, where nothing around it says what it may be
used for. Every skill in this repository is `CC-BY-4.0`, matching
`blueprints/LICENSE`, which covers `skills/` as well (§8).

**Verify against the real tools at release time, not in CI.** Before tagging a
release:

```bash
gh skill publish --dry-run .        # the official validator, run locally
npx skills add forgeprint/forgeprint --list
```

The first is the specification's own implementation; if it disagrees with
`forgeprint validate`, the specification is right and this repository changes.

## What was verified, and when

Against `gh` 2.97.0 and `skills` 1.7.0, on 2026-09-22, at tag `v0.2.0`:

| Command | Result |
| --- | --- |
| `gh skill publish --dry-run .` | passes; discovers all three skills |
| `gh skill install forgeprint/forgeprint blueprint-review` | installs from the latest tag |
| `gh skill install forgeprint/forgeprint blueprints/dotnet-web-api/skills/efcore-migrations` | installs by exact path |
| `npx skills add forgeprint/forgeprint --skill blueprint-author --agent claude-code` | installs to `.claude/skills/` |
| `npx skills add forgeprint/forgeprint --list` | finds the two catalog skills, **not** the blueprint's |

## Consequences

- A blueprint's own skills are not discovered by `npx skills add`, which
  searches the repository root and `skills/` rather than every folder. That is
  acceptable: a blueprint's skills are part of the blueprint, and the MCP
  server hands them over with it. `gh skill install` reaches them by exact
  path for anyone who wants one on its own.
- `gh skill install` resolves the latest tag before the default branch, so
  skills ship at releases. A change to a skill reaches installers when a
  version is tagged, not when it is merged.
- Tag protection is worth turning on — `gh skill publish --dry-run` says so,
  and the repository has release immutability enabled, which a moved tag would
  undermine.
- The compatibility claim now fails loudly. If either tool changes its rules,
  the release-time commands above disagree with `validate`, and this ADR is
  where the answer gets written down.
