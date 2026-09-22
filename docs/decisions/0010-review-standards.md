# 10. A blueprint is reviewed against named standards, not taste

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Implements: CLAUDE.md §5c, rule 23

## Context

The catalog's promise is that everything in it was worth adding. Until now
that was enforced by three things: a schema, a linter, and a recipe that has to
run. All three check that a blueprint is *correct*. None of them asks whether
it is *well designed* or *safe to build on*.

That gap matters more here than in a normal starter repository. A blueprint is
copied into somebody's project and then extended by an agent that treats it as
the house style. A bad boundary or a missing security control is not one
project's problem; it is reproduced every time the blueprint is resolved.

The obvious way to close the gap is a reviewer's judgment. The obvious failure
of that way is that judgment drifts: it reflects what the reviewer read most
recently, it cannot be argued with, and it is not the same twice. A finding
that amounts to "I would not do it that way" wastes a contributor's afternoon
and teaches nobody anything.

## Decision

**Review against named, versioned, dated standards.**

`docs/review-standards.md` lists every reference the review draws on, with its
current version, its link, and the date it was last checked. **Every checklist
item cites one of them.** An item with no citation does not go in the review.

The review itself is `skills/blueprint-arch-review`, run through
`/arch-review <slug>`. It reads what the blueprint actually ships —
`AGENTS.md`, `setup.md`, `mcp.json`, `scripts/` — and reports findings as
`critical | high | medium | low | info`. Each finding says what, where
(`file:line`), which standard it comes from, and how to fix it.

Reports are committed to `docs/reviews/<slug>/<YYYY-MM-DD>.md`, because a
review nobody can read is a claim rather than a check. The verdict is `MERGE`
or `CHANGES`, and **an open `critical` or `high` finding blocks
`tier: official`** (rule 23).

**The deterministic half moves into the linter.** Running as root, a `latest`
tag, an unpinned version, `http` where `https` is meant, wildcard CORS, a
secret in code — these are decidable by machine, so a person should never be
the one to notice them. `forgeprint lint-setup` gets them; the skill keeps what
needs judgment: boundaries, dependency direction, observability, whether the
test strategy tests the claim.

**The list is re-checked every 90 days.** A standard cited at the wrong version
is worse than no citation, because it sounds authoritative. The roadmap carries
the reminder.

## Consequences

- Writing the checklist requires reading the standards, which is the point.
  The cost is real and it is paid once per reference rather than once per
  review.
- A finding can be argued with, by naming the reference and showing it says
  something else. That is a feature: it is how the checklist gets corrected.
- Some references will disagree with each other. Where they do, the report says
  so and the maintainer chooses, in writing.
- `tier: official` becomes meaningfully harder to reach than `community`, which
  is what the tiers were for. The three .NET blueprints and the two written
  since predate this decision and are reviewed retroactively; any that fail
  drop to `community` until the findings are closed.
- A blueprint can pass every linter and fail this review. That is the gap this
  decision exists to cover.
