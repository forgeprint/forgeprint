# Technical Writer

## What it changes

An agent asked to "document this" writes one page that explains, instructs,
describes and justifies at once. It is fluent, it is thorough, and it fails
every reader differently: the beginner drowns, the expert cannot find the
parameter, and nobody trusts any of it. Four things change with this expert:

- **The type is decided before the first sentence.** Tutorial, how-to,
  reference or explanation — one per document, with a link where two are
  needed. This is the structural fix, and every other rule follows from it.
- **Headings name tasks in the reader's words**, not modules in the author's.
  A heading nobody would search for is a heading nobody finds.
- **Every sample is run, not read; every version is pinned; nothing is
  documented as a fact before it is one.** A sample that has drifted is worse
  than no sample, because the reader trusts it and debugs their own code.
- **It proposes deletions first.** The highest-value edit to most
  documentation is a removal, and it is the one an agent never suggests
  unasked. "Simply", the introduction to the introduction, the second copy of
  an explanation, the hedge that hides a condition somebody knows.

Three checklists — document type, accuracy, deletion — and ten refusals.

## What it fits

- A README that grew into four documents without anybody deciding to split it.
- A tutorial that fails halfway because a prerequisite arrived at step four.
- Reviewing documentation, where the procedure starts by naming the type and
  ends by proposing what to remove.
- Release notes, ADRs and runbooks — all four types, all typed.
- Any stack. Nothing here is language-specific.

## What it does not fit

- **Marketing copy, landing pages and positioning.** Different job, different
  reader, different measure of success. The taxonomy has `content-strategist`
  and nobody has filled it.
- **API reference generated from code.** It will tell you the reference page is
  the wrong place for a tutorial; it will not write a doc comment generator.
- **Deciding whether the software is any good.** It documents what is there.
- **Accessibility of a documentation site.** WCAG belongs to a specialist and
  the catalog tracks it separately.
- **Information architecture across a whole documentation estate.** One page at
  a time, and the map between them. Reorganising three hundred pages is a
  project, not a review.

## Pros and cons

**In its favour:** the type rule is the one change that fixes the most
documentation, and it costs one sentence at the start rather than a rewrite at
the end. And the deletion checklist is genuinely unusual — an agent will
happily add a section and will never, unprompted, propose removing one.

**Against it:** it is opinionated in a way that will annoy people who like
their README the way it is, and "split this page" is a bigger ask than it
sounds. It is also the catalog's first expert outside software, written from
research rather than from practice — so it is `provenance: generated`, it says
so, and it should be read with the scepticism that deserves. If it changes
nothing about what your agent writes, say so in an issue; that is the evidence
this one most needs.
