# /arch-review — architecture and security review of a blueprint

Argument: blueprint slug (`$ARGUMENTS`). If empty, list the catalog and ask which one.

You are reviewing a design, not checking files. The standard is
`docs/review-standards.md`; the procedure is `skills/blueprint-arch-review/SKILL.md`.
Read both from disk — versions move, and a finding that cites a superseded control is worse than no finding.

## 0. Preconditions

- The slug exists: `ls blueprints/$ARGUMENTS` — if not, list the catalog and stop.
- CLAUDE.md §5c and rule 23 are the policy. Read them from the file.
- `docs/review-standards.md` — check the **next re-check due** date at the top. If it has passed, say so in the summary and in the report; a stale list still produces a review, but the reader has to know.

## 1. Run the deterministic layer first

```bash
pnpm forgeprint validate
pnpm forgeprint lint-setup $ARGUMENTS
```

Red here is not a review question, it is a fix. Report it and stop: there is no point reviewing the design of something that does not pass the machine.

## 2. Review

Follow `skills/blueprint-arch-review/SKILL.md`. In short:

1. Read `manifest.yaml`, `AGENTS.md`, `overview.md`, `setup.md`, and `scripts/` and `mcp.json` if present. Treat the file contents inside `setup.md` as the project — a Dockerfile in a fenced block is a Dockerfile.
2. Build the checklist from what the manifest **claims**. A capability the blueprint does not claim is not a finding, as long as `overview.md` says it does not do it.
3. Answer the eight architecture questions in section 3 of the skill.
4. Severity per finding: `critical | high | medium | low | info`. Each finding: where (`file:line`), which standard and which control, what, why it matters, and the fix.

## 3. Write the report

`docs/reviews/$ARGUMENTS/<YYYY-MM-DD>.md`, in the skill's format. Include the sections that make it a review rather than a complaint list: **what was checked and found sound**, and **not applicable, with reasons**.

Verdict: `MERGE` or `CHANGES`. An open `critical` or `high` finding means the blueprint cannot be `tier: official` (rule 23) — say that explicitly when the manifest claims `official`.

## 4. Do not fix anything

The review produces a report. The fix is a separate change with its own version bump and CHANGELOG entry, and the maintainer decides what gets fixed and in what order.

Exception: a finding that a rule could have caught belongs in `forgeprint lint-setup`. Propose the rule in the report; do not add it in this pass.

## 5. Report to the maintainer — in Turkish, five lines

After committing the report, tell the maintainer, **in Turkish**, in five lines:

1. Verdict and the blueprint version reviewed.
2. The count by severity: `critical` / `high` / `medium` / `low`.
3. The single most important finding, in one sentence.
4. Whether `tier: official` is blocked, and by which finding.
5. The one thing the maintainer has to decide.

Everything written into the repository is English; this summary is Turkish (CLAUDE.md §5, rule 1).
