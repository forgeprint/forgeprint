# Research Engineer

## What it changes

Ask an agent "which of these should we use" and it answers at once, fluently,
from memory. The answer cites nothing, does not say which version it
describes, and reads the same whether the evidence is strong or absent. Five
things change with this expert:

- **The question comes before the search.** Scope, the decision it serves, who
  decides, the options already on the table, what answer would change the
  decision, and the stopping rule — dated, before the first query.
- **The search leaves a log.** Where, what, when, how many hits, how many
  kept, written as it runs. Counter-evidence is searched for by name, and what
  was looked for and not found gets its own section.
- **Every source is graded** on the same columns: primary or secondary,
  independent or vendor, outlet tier, version described, date read. Vendor
  documentation counts for what a product claims, not for how well it does it.
- **Every number is fetched from where it originates.** A number seen only in
  somebody's summary is listed as not verified and kept out of the answer.
  Where sources disagree, both are reported with the likeliest reason.
- **The output is a decision, not a reading list.** Options with evidence for
  and against, a certainty per conclusion with the reason it is not higher,
  and what would change the answer. An ADR draft stays `proposed`.

Five checklists — question first, search log, source grading, traceable
claims, decision ready — and eleven refusals.

## What it fits

- Choosing between libraries, frameworks, vendors or approaches, when the
  choice is expensive to reverse.
- The evidence section of an ADR somebody else will accept or reject.
- Checking a claim before it goes into a design: "X is faster", "Y is
  deprecated", "Z supports this".
- Re-checking an old decision against what has changed since, when the old ADR
  said what would change it.
- Any stack. Nothing here is language-specific.

## What it does not fit

- **Questions with one known answer.** Looking up an API signature is a
  documentation lookup, not research; the procedure here is overhead for it.
- **Deciding.** It prepares the evidence and names the options; the architect,
  the product manager or the owner decides. It will not mark an ADR accepted.
- **Running a benchmark.** It finds, grades and compares measurements. Designing
  a new one is the `performance-engineer` role.
- **A formal academic review** — a registered protocol, independent reviewers,
  months of screening. It borrows from those methods and does not replace them;
  the `literature-reviewer` role is unfilled.
- **Market and competitor research.** Pricing, positioning and sales evidence
  are a different job with different sources.
- **Anything that changes code.** The output is a document.

## Pros and cons

**In its favour:** the `## Not found` section and the "not verified" list are
two headings that change what an agent hands over — it stops presenting
recall as research and starts saying where the evidence ran out. And grading
vendor documentation as primary for claims but not for performance catches the
most common error in technology comparisons.

**Against it:** it is slower, on purpose, and a quick question does not need
it. The sources it rests on are software-engineering review guidelines written
for academic studies, adapted here to an afternoon's work, and GRADE comes from
medicine; `references.md` says so rather than hiding it. It is also
`provenance: generated` — drafted by a tool from research rather than from
practice — so read it with that in mind, and say so in an issue if it changes
nothing about what your agent produces.
