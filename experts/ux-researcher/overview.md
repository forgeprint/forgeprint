# UX Researcher

## What it changes

An agent asked to "do some user research" writes a survey about whether people
like a feature, or reviews a screen and says what it thinks of it. This expert
does neither. It is methods only — the expansion plan refuses visual and UI
taste (D4) — and it changes six things:

- **A research question and the decision it informs come before the method**,
  and the method is justified on Rohrer's axes: what people say or do, why or
  how many.
- **Usability test tasks are goals, not instructions**, and success criteria
  are dated before the first session, so they cannot bend to what happened.
- **Sample size is cited and bounded.** Five per round for a formative test
  (Nielsen 2000), with the 31% average discovery rate it rests on written next
  to it; about 40 for a quantitative study (Budiu and Moran 2021). No
  percentages from five people.
- **SUS is scored as Brooke wrote it**, recomputable from raw responses, and
  never called a percentage; 68 is the comparison point.
- **Consent comes before recording**, withdrawal is one step, and participant
  data is minimised with a deletion date (GDPR Articles 5 and 7).
- **Synthesis keeps observation and interpretation apart**, and every finding
  lists the observations and the number of participants behind it.

Six checklists, eleven refusals, every row citing a source checked on
2026-09-25.

## What it fits

- Planning a moderated usability test, and writing the protocol somebody else
  could run.
- Reviewing a research plan or report before its findings drive a decision.
- Scoring and reporting SUS without the usual mistakes.
- Turning a pile of session notes into findings a sceptical reader can trace.
- Any product with a human interface; nothing here is stack-specific.

## What it does not fit

- **Whether a design looks good.** Refused in this catalog (D4). The checkable
  parts of UI quality are [`frontend-engineer`](../frontend-engineer/SKILL.md)
  and the `accessibility-specialist` role.
- **Accessibility audits.** WCAG 2.2 conformance is the `accessibility-specialist`
  role's; this expert includes participants with disabilities but does not
  audit conformance.
- **Deciding what to build.** [`product-manager`](../product-manager/SKILL.md)
  takes the findings from here.
- **Turning findings into specified requirements.** The `business-analyst`
  role.
- **Legal and ethics approval.** The legal basis, impact assessments and ethics
  review belong to the `privacy-engineer` role and counsel; this expert only
  makes sure the referral happens.
- **Analytics, A/B tests and large surveys.** It names where they fit on the
  method axes but does not cover experiment design or statistics beyond
  reporting an interval.

## Pros and cons

**In its favour:** it answers the demand for "UX" with the half that can be
checked, and every row is a document, a date or a recomputation. The
sample-size checklist is unusual: it makes the agent write down the limits of
the numbers everybody quotes.

**Against it:** much of the method literature is practitioner guidance rather
than standards, and the two ISO standards are paid texts cited at document
level. The consent checklist uses the GDPR because it is precise and public;
research under other regimes needs its own rules. And it is
`provenance: generated` — drafted from research, not from running studies — so
the first real study run with it is the evidence it needs.
