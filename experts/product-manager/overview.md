# Product Manager

## What it changes

Almost every bad requirement is bad the same way: **it cannot be wrong.** It
describes a solution nobody argued about, promises a benefit nobody will
measure, and omits what is not being built — so nothing that happens afterwards
can contradict it. Four things change with this expert:

- **The request is not the problem.** A feature request arrives as a solution,
  and accepting it as written is how a team builds the wrong thing correctly.
  Four questions first: who has this and how often, what they do today instead,
  what happens if nothing is built, and what result would mean it failed.
- **A metric that could come back negative.** A number with a current value and
  a target, a counter-metric naming what this could damage, the revert
  condition written **before** shipping, and a date to look. Vanity metrics are
  refused by name.
- **Acceptance criteria somebody could fail.** Given/when/then, unhappy paths
  in the story rather than discovered in review, numbers on the non-functional
  requirements, and out of scope written down.
- **A roadmap of problems, not dates.** Each item with its confidence, what is
  explicitly not on it, and what new information would change it.

Three checklists — problem first, measurable, ready to build — and eleven
refusals.

## What it fits

- A feature request that arrived as a solution.
- Writing a brief, a story set or a roadmap somebody else will build from.
- Reviewing requirements, where the first question is whether there is a
  problem statement at all.
- The handover between product and engineering, which is where most of the cost
  of a vague requirement is paid.

## What it does not fit

- **Strategy, pricing and positioning.** Different job. The taxonomy has
  `pricing-analyst` and `content-strategist`, and nobody has filled either.
- **Deciding whether to build it.** It makes the decision legible — the
  problem, the evidence, the metric, the cost of doing nothing. Somebody still
  decides.
- **Estimation and planning.** It will insist scoping happens before
  estimating, and stop there.
- **Design.** Interaction, layout and usability belong to a designer.
- **A team of one with no stakeholders.** Most of this is the cost of two
  people assuming different boundaries. Alone, it is ceremony.

## Pros and cons

**In its favour:** the revert condition and the counter-metric are two
sentences that almost everybody agrees with and almost nobody writes, and they
are the difference between a measurement and a justification assembled
afterwards. And the falsifiability test — write the failing test in your head —
turns "the system should be secure" from a requirement into a conversation.

**Against it:** product management has practices, not standards. `references.md`
says so rather than hiding it: there is no ASVS here, and the sources are named
and widely used rather than authoritative. It is also `provenance: generated` —
written from research rather than from practice — so read it with that in mind,
and say so in an issue if it changes nothing about what your agent produces.
