# 11. A generated blueprint says so, and cannot be official

- Status: Accepted
- Date: 2026-09-23
- Deciders: core maintainer
- Extends: [ADR 0008](0008-provenance.md) (where a blueprint came from),
  CLAUDE.md §3.1 (manifest schema) and rule 14 (tiers)

## Context

The catalog grows by demand, and the demand is now measured
([catalog-research](../../skills/catalog-research/SKILL.md)). Measuring it
produces a list of combinations nobody has written a blueprint for, and the
obvious next step is to have an agent draft them: the recipe format is strict,
CI executes every step, and a draft that does not run never reaches a pull
request.

That is a real capability and it is worth having. It is also a different thing
from what the catalog has been selling. Every blueprint so far was written by a
person who had built the thing first — that is what `blueprint-author` is for —
and the value was never only that the commands execute. It was that somebody
decided these were the right commands.

A generated blueprint can pass everything the machine checks and still be
wrong in the way that matters: plausible steps, in a plausible order, that
nobody has ever actually depended on. CI cannot tell the difference. A reader
cannot either, unless we say so.

## Decision

**1. The manifest records who wrote it.** A new field, `provenance`, with two
values:

```yaml
provenance: human # or: generated
```

It defaults to `human` when absent. Every blueprint written before this field
existed was written by a person, and a default of anything else would be a lie
about all of them.

**2. A generated blueprint cannot be `tier: official`.** The schema refuses
the combination — not a review guideline, a validation error. `official` is the
catalog saying a person stands behind this; a tool drafted it and CI ran it is
a different claim, and it gets `community` or `verified`.

Note what `verified` still means: a maintainer ran the setup and confirmed it
(rule 14). A generated blueprint can earn that, because running the setup is
something a person can do without having written it. What it cannot earn is
`official`, which is about authorship.

**3. It is said out loud, everywhere the blueprint is served.** The MCP
server's `tier_note` carries *"Generated, CI-tested, not manually verified"*,
alongside the community note where both apply. The site puts the same sentence
on the blueprint's page. The index carries the field so both can.

**4. The same gates apply, plus one.** A generated draft passes `validate`,
`similarity`, `lint-setup`, `test-setup` **and** an architecture and security
review (§5c) before its pull request opens — the review is not optional for a
generated blueprint the way it is skippable for a trivial edit. Then
`/review-pr` reviews it like any other, and the core maintainer merges it or
does not.

## Consequences

- The catalog can grow faster than one person can write blueprints, without
  pretending it grew the other way.
- A reader choosing between two blueprints has the information that actually
  distinguishes them. Some will avoid generated ones; that is the correct use
  of the field, not a failure of it.
- `provenance` had to be freed up. It previously named the object recording
  which project a blueprint was derived from; that object is now
  `derived_from`, with its URL under `url`. Nothing in the catalog used it yet,
  so the rename cost nothing — but it is a schema change, and this is the
  record of it.
- Two blueprints could be identical in quality and differ only in this field.
  That is accepted: the field does not claim generated blueprints are worse. It
  says which kind of confidence is on offer, and lets the reader decide what
  that is worth.

## Alternatives considered

**Not generating blueprints at all.** The safest option, and the one that keeps
the catalog small enough to be hand-written forever. Rejected because the
demand report shows eleven of the fifteen strongest combinations uncovered, and
a catalog that cannot answer is not protecting anybody from anything.

**Generating them and saying nothing.** Rejected outright. The catalog's whole
argument against the alternatives is that it is curated (CLAUDE.md §2). Quietly
filling it with machine output would be the exact failure its positioning
claims to avoid, and it would be found out.

**A fourth tier, `generated`.** Tempting, and wrong: authorship and verification
are different axes. A generated blueprint whose setup a maintainer has run is
more trustworthy than a hand-written one nobody checked, and one tier cannot
express both. Two fields can.
