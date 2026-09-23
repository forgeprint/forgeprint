---
name: blueprint-arch-review
description: Review a Forgeprint blueprint as an architecture and a security surface, against named standards. Use before a blueprint becomes tier official, as step 3b of a pull request review, when asked whether a blueprint is safe to build on, or when re-reviewing after the standards list changes.
license: CC-BY-4.0
---

# Reviewing a blueprint as a design

A blueprint is copied into somebody's project and then extended by an agent
that treats it as the house style. A bad boundary is not one project's problem;
it is reproduced every time the blueprint is resolved. This review asks whether
the design is sound and whether it is safe to build on — questions the schema,
the linter and a recipe that runs cannot answer.

**Every finding cites a standard.** `docs/review-standards.md` is the list,
with versions and dates. A finding that cites nothing is an opinion, and an
opinion in a review wastes a contributor's afternoon and teaches nobody
anything ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

---

## 1. Read the blueprint, not your memory of it

```bash
cat blueprints/<slug>/manifest.yaml
cat blueprints/<slug>/AGENTS.md
cat blueprints/<slug>/overview.md
cat blueprints/<slug>/setup.md
ls blueprints/<slug>/scripts blueprints/<slug>/mcp.json 2>/dev/null
```

Read `setup.md` as the artefact it is: the file contents inside it **are the
project**. A Dockerfile in a fenced block is a Dockerfile; a `Program.cs` in a
fenced block is the code every reader will start from. Review those, not the
prose around them.

Then read the standards list. Not from memory — versions move, and a finding
that cites a superseded control is worse than no finding:

```bash
cat docs/review-standards.md
```

## 2. Build the checklist from the blueprint's own claims

A generic checklist produces generic findings. Derive it:

| The manifest says                  | So the review must ask                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `requirements: [auth]`             | ASVS V2 and V3: where credentials are verified, how a token is validated, what happens with none |
| `requirements: [multi-tenant]`     | Whether isolation is enforced in the data layer, and what the tests prove — OWASP API1 (BOLA)    |
| `requirements: [containerization]` | CIS Docker: non-root user, pinned base image, no secrets in layers                               |
| `project_type: api`                | OWASP API Security Top 10, all of it                                                             |
| `project_type: agent`              | OWASP LLM 2025 and Agentic 2026, plus the MCP specification's security section                   |
| `platforms: [docker]`              | The same CIS scope, plus what the container is allowed to reach                                  |
| `requirements: [ci]`               | SSDF and SLSA: pinned actions, least-privilege permissions, what the build trusts                |
| `requirements: [accessibility]`    | WCAG 2.2 by success criterion — and whether what the blueprint verifies is as wide as the word   |
| `requirements: [seo]`              | Whether the claim is tested against the built output rather than against the templates           |
| `project_type: web`                | What reaches the browser: third-party scripts, what they see, and what the reader gets with none |

Whatever a blueprint does **not** claim is not a finding. A blueprint without
`auth` is not missing authentication; it is a blueprint that says it does not
do authentication, and `overview.md` has to say so under "What it is NOT for".

The mirror of that rule: a claim wider than its verification **is** a finding,
because `resolve` matches on `requirements` and sends people here on the
strength of the word. `accessibility` is where this bites first — the part a
build can assert (language, heading count, a skip link, `alt` present) is a
fraction of what the word promises, and contrast, focus order and whether the
alt text describes anything are invisible to it. Ask where the gap is
disclosed. Disclosed in `overview.md` and in the tests is a `medium` worth
recording; undisclosed is the finding itself.

## 3. The architecture questions

These need judgment, which is why they are not in the linter:

1. **Boundaries.** Is there a line between domain and infrastructure, and does
   it survive the first real change? A folder named `Domain` that imports a
   database driver is a claim, not a boundary — Clean Architecture's dependency
   rule, hexagonal ports and adapters.
2. **Dependency direction.** Does anything inner depend on anything outer? Name
   the file and the import.
3. **Configuration.** Is it read from the environment, in one place, with no
   working production default? Twelve-Factor III.
4. **Secrets.** Where would a reader put a real one, and does the recipe lead
   them somewhere safe? A committed example that looks real is a finding on its
   own (CLAUDE.md §5b).
5. **Observability.** Can somebody operating this tell what it is doing —
   health, logs, and whether a failure is visible? OWASP A09.
6. **Test strategy.** Do the tests prove the claim the blueprint makes, or only
   that it compiles? A multi-tenant blueprint whose tests never attempt a
   cross-tenant read has not been tested.
7. **Error handling.** What does a failed dependency do — OWASP A10, new in the
   2025 edition, and the one most starters get wrong.
8. **What it does not do.** Does `overview.md` say so plainly? An omission that
   is documented is a design decision; the same omission undocumented is a
   defect.

## 4. Severity, and what it costs

| Severity   | Meaning                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `critical` | Exploitable as shipped, or it leaks a secret. Blocks any tier                                            |
| `high`     | A security control is missing or wrong, and a reader would not notice. Blocks `tier: official` (rule 23) |
| `medium`   | A real weakness with a workaround, or a boundary that will not survive                                   |
| `low`      | Worth fixing, costs little, breaks nothing                                                               |
| `info`     | Worth knowing. Not a defect                                                                              |

Severity describes the finding, not how much work the fix is. A one-line fix
can be `critical` and a rewrite can be `low`.

## 5. Write the report

To `docs/reviews/<slug>/<YYYY-MM-DD>.md`. The reports are committed because a
review nobody can read is a claim rather than a check (CLAUDE.md §5b).

```markdown
# <slug> — architecture and security review

- Date: YYYY-MM-DD
- Blueprint version: <manifest version>
- Standards: docs/review-standards.md as of <date of its last check>
- Verdict: MERGE | CHANGES

## Summary

Two or three sentences. What this blueprint is, and the single most important
thing a reader should know before building on it.

## Findings

### 1. <one line saying what is wrong> — `high`

- **Where:** `blueprints/<slug>/setup.md:142`, step 17
- **Standard:** OWASP ASVS 5.0 V2.1.1
- **What:** what the blueprint does today, in one sentence.
- **Why it matters:** the consequence for somebody who builds on it.
- **Fix:** the concrete change, specific enough to make.

## What was checked and found sound

The controls that were looked at and hold. Naming them is what makes the
report a review rather than a list of complaints, and it tells the next
reviewer what not to re-derive.

## Not applicable

Controls that do not apply, with the reason. "Not tested" and "does not apply"
are different statements.
```

## 6. Move what a machine can decide

Any finding that could have been found by a rule belongs in `lint-setup`
instead: running as root, a `latest` tag, an unpinned version, `http` where
`https` is meant, wildcard CORS, a secret-shaped string. A person noticing
those is a process failure — the second time it happens, add the rule and say
so in the report.

---

## Never

- **Do not review from memory of a standard.** Open
  `docs/review-standards.md`, and follow the link when a control number is
  going into a report.
- **Do not raise a finding about a capability the blueprint does not claim.**
  Check `overview.md` says it does not, and move on.
- **Do not fix the blueprint in this pass.** The review produces a report; the
  fix is a separate change with its own version bump and CHANGELOG entry.
- **Do not grade on effort.** A blueprint that took a long time and is unsafe
  is unsafe.
- **Do not pass a blueprint because CI is green.** Green means the recipe runs.
  This review exists because that is not the same as being worth building on.
