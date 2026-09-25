# Business Analyst

## What it changes

An agent asked for requirements writes a fluent list of what the system
"should" do, paraphrased from the conversation, with the quality attributes as
adjectives and no way to tell afterwards which sentence came from whom. This
expert changes five things:

- **Every requirement has a source.** Elicitation is recorded and confirmed
  with the source before anything is derived (BABOK v3 tasks 4.2 and 4.3). A
  statement with no source goes in the assumption log, visibly.
- **Every requirement is singular and greppable for vagueness.** The INCOSE
  Guide to Writing Requirements v4 rules on vague terms, escape clauses,
  open-ended clauses and combinators turn "fast and user-friendly where
  possible" into a finding, not a requirement.
- **Quality attributes walk the ISO/IEC 25010:2023 model** — all nine
  characteristics, each with a measure, unit, range and condition, or "not
  applicable" and why.
- **The trace runs both ways.** Forward finds untested requirements; backward
  finds scope nobody asked for. A change is assessed against the trace before
  anybody estimates it.
- **Processes are valid BPMN 2.0.2**, current and future state apart, with
  decision logic in a rules catalogue rather than in gateway labels.

Six checklists, eleven refusals, every row citing a source checked on
2026-09-25.

## What it fits

- Turning interview notes, emails and a legacy screen into a specification a
  team can build and a tester can fail.
- Reviewing somebody's requirements or user stories before sprint planning.
- Replacing a system, where transition requirements and the current-state
  process decide go-live.
- Integrations between organisations or departments, where the BPMN pool and
  message rules expose the hand-offs.
- Any stack and any domain; nothing here is software-language-specific.

## What it does not fit

- **Deciding what is worth building, the success metric, or the order.** That
  is [`product-manager`](../product-manager/SKILL.md). The boundary: the
  product manager decides the problem and the outcome; this expert makes the
  resulting requirements precise, sourced and traceable. Both write acceptance
  criteria; this expert holds them to the Gherkin reference and traces each to
  an ID.
- **Delivery plans, owners and dates.**
  [`technical-program-manager`](../technical-program-manager/SKILL.md).
- **Whether the tests exist and pass.** [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- **User research and usability testing.** The `ux-researcher` role.
- **Regulated requirements needing a named compliance framework** (medical,
  aviation, finance). The characteristics apply; the regulator's own rules are
  not here.
- **A two-line change to a small tool.** The trace matrix and the 25010 walk
  cost more than they return there.

## Pros and cons

**In its favour:** most rows are a grep or a count, so a review is quick and
settles arguments about wording. The backward trace and the 25010 walk find
the two things specifications most often get wrong: unrequested scope and the
quality attribute nobody mentioned.

**Against it:** the key sources are closed. BABOK's text needs an IIBA login,
the INCOSE guide is a purchase for non-members, and the ISO standards are
paid; the rows therefore cite task numbers, rule numbers and characteristic
names, not the texts, and `references.md` says so. It is also
`provenance: generated` — drafted from research rather than from a real
engagement — and the first specification written with it is the evidence it
needs.
