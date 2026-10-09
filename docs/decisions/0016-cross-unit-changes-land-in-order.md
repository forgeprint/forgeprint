# 16. A change that spans two units lands in order, and the first half says so

- Status: Accepted
- Date: 2026-10-09
- Deciders: core maintainer
- Constrained by: [ADR 0012](0012-experts-crews-integrations.md) (four units,
  referenced by slug), rule 9, D33 of the
  [2026-09-24 expansion plan](../research/2026-09-24-expansion-plan.md)

## Context

`validate` refuses a slug it cannot find. That is the rule the four units rest
on: a crew names members, a blueprint names `recommended_experts`, an expert
names `pairs_with`, and every one of those is a claim the catalog checks rather
than a string nobody reads.

D33 of the expansion plan already answered this for crews — "a crew is built
once every member and integration is on `main`; until then it waits, with the
pull requests it needs named." On 2026-10-09 the same rule shaped three pull
requests in one afternoon, in three different fields:

| Pull request | The field | What had to wait |
| --- | --- | --- |
| [#245](https://github.com/forgeprint/forgeprint/pull/245) | `pairs_with` | `swift-mobile-engineer`, open in #244 |
| [#248](https://github.com/forgeprint/forgeprint/pull/248) | `recommended_experts` | both Swift experts, open in #244 and #245 |
| [#250](https://github.com/forgeprint/forgeprint/pull/250) | `requires_tools` | a CLI fix, open in #249 |

Three times is a pattern rather than three accidents, and each time the first
draft was written as though both halves could land together — which `validate`
refused, correctly, after the work was done.

The pull request descriptions said so each time. Nothing in the repository did.

## Decision

**A change that spans two units is two pull requests, in dependency order, and
the first one states what the second will add.**

1. **The half that can stand alone goes first.** An expert before the crew that
   names it; a CLI fix before the blueprint that needs it. If neither half
   stands alone, the change is one unit wearing two names and the shape is
   wrong.
2. **The first half ships with the field empty and a sentence saying why**, in
   its `CHANGELOG.md` — not only in the pull request, because a pull request
   description is not in the repository and a reader six months later is
   holding the folder, not the thread. "`pairs_with` names two of three;
   `swift-mobile-engineer` is in #244 and `validate` refuses a slug that is not
   on `main` yet" is the whole sentence.
3. **The second half is its own pull request, with its own version bump and
   CHANGELOG entry**, and its "closest existing entry" section says it is a
   change to the unit it completes.
4. **Nobody loosens `validate` to allow a forward reference.** A slug that
   exists only in a branch is a promise, and the catalog's claim is that it
   checks what it says. A warning instead of a refusal would make every
   dangling reference survive review, which is the junk drawer rule 9 exists to
   prevent.

## Consequences

- **A two-unit change costs an extra round**, and that is the price of the
  check. The alternative is a catalog that names things which do not exist.
- **The order is visible in the pull request titles**, which is how a reviewer
  knows to merge #244 before #245 without reading both.
- **The empty field is a to-do with a name on it.** The CHANGELOG sentence is
  what makes the follow-up findable when the person who promised it is not
  there, and it is the line to grep for when asking what the catalog still owes.
- **The generated `docs/` conflict is separate and unavoidable.** Both halves
  regenerate `docs/index.json`, the unit pages and the landing page's counts, so
  the second half is rebuilt on the main the first one created — mechanically,
  per §5d, not as a judgement.
- **This does not apply to a single unit's own files.** A blueprint and its
  recipe, an expert and its checklists, ship together; the rule is about one
  unit naming another.

## Alternatives considered

**Let `validate` warn on an unknown slug instead of refusing.** Rejected: the
refusal is the feature. A catalog whose cross-references are checked is worth
the extra round; one whose references are usually right is worth nothing,
because a reader cannot tell which kind they are holding.

**Merge both halves in one pull request and let `validate` run on the result.**
Tempting and it would work, because the final tree is consistent. Rejected
because it is one pull request containing two units, which the contribution
rules refuse for a different and still good reason: a review of two units at
once is a review of neither, and the duplicate report, the setup test and the
version bump all answer per unit.

**Keep it in CONTRIBUTING.md rather than an ADR.** CONTRIBUTING says what to
do; this says why the cost is accepted, and the question "can we just make
validate warn" is the kind that comes back. It belongs where the answer is kept
with its reasoning.
