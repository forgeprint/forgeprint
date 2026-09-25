# Privacy Engineer

## What it changes

Asked whether a system is "GDPR compliant", an agent either reassures or
recites the regulation. Neither changes the system. This expert turns privacy
into files and tests:

- **A per-field inventory found from the code** — schema, API types, analytics
  events, SDK calls — with purpose, stores, recipients, retention and a
  deletion path for every row. Processors are recipients, and they are where
  most of the exposure is.
- **Minimisation in the schema and the defaults**, and a migration that adds a
  personal-data field updates the inventory in the same pull request.
- **Deletion as code with a test**: a scheduled retention job, erasure that
  reaches every store and processor the inventory lists, and an end-to-end
  test that deletes a user and searches for what is left.
- **A DPIA screening, written down**: Article 35(3), the nine WP248 criteria
  one by one, the supervisory authority's list — and the name of the person who
  confirmed the result.
- **LINDDUN on the data-flow diagram**, so privacy threats get IDs and
  responses the way security threats do.
- **Personal data kept out of logs, error trackers and analytics** by
  configuration, checked by a grep.

Six checklists — data inventory, minimisation, retention and deletion, DPIA
triggers, privacy threats, personal data in logs — and seven refusals.

## What it fits

- A feature that collects, stores, shares or logs personal data, before it
  ships.
- Adding a processor: an email provider, an error tracker, analytics, an LLM
  API.
- Implementing erasure requests properly, and proving the implementation.
- Preparing the engineering inputs to a DPIA that counsel or the DPO will
  conduct.
- Any stack. The commands are greps and tests; the regulation is the GDPR
  because it is the most widely applied text, and the engineering controls
  carry over to other regimes even where the article numbers do not.

## What it does not fit

- **Legal advice.** It will not say that processing is lawful, that a basis is
  valid, that a transfer is permitted, or that a DPIA is not legally required.
  It records those decisions, made by counsel or the data protection officer,
  with a reference. The `data-protection-officer` role in the taxonomy has no
  expert, and should belong to a person.
- **Privacy notices, consent text and contracts with processors.** Legal
  drafting.
- **The security threat model.** A planned appsec-engineer expert owns it; this
  one adds privacy threats to the same diagram rather than drawing another.
- **Security review of a change:** [`security-reviewer`](../security-reviewer/SKILL.md).
- **Certification** against ISO/IEC 27701 or any other scheme.

## Pros and cons

**In its favour:** it finds the exposure most reviews miss — the processors, the
log lines, the backups — because the inventory is built from the code rather
than from what people remember. The deletion test is the single most useful
artefact: it is what turns "we honour erasure requests" into something a CI
run can contradict.

**Against it:** the inventory is laborious on an existing system, and it goes
stale unless the same-pull-request rule is actually enforced. The legal
boundary is a real limitation: the most consequential privacy questions are
legal ones, and this expert deliberately stops at their edge. It is written
against the GDPR; teams under other regimes have to map the articles
themselves. And it has not been run on a real project by a person —
`provenance: generated` is the honest label.
