# Site Reliability Engineer

## What it changes

An agent asked about reliability without this expert writes "99.9% uptime"
into a document, adds alerts on CPU and memory, and — during an incident —
starts debugging the first interesting log line. Afterwards it writes a
summary that says what broke and who changed it. None of that can be checked,
and the same incident comes back.

This expert makes each part a file with required contents:

- **SLOs as OpenSLO files** — a good-events query over a total-events query,
  a window and a target, validated by `oslo validate`, with the budget in
  minutes written next to it.
- **An error budget policy agreed in advance** — what happens at an
  intermediate threshold and at zero, who grants exceptions, and when a single
  incident forces a postmortem.
- **Pages on burn rate** — the SRE Workbook's multiwindow, multi-burn-rate
  table, with causes left to dashboards and tickets.
- **Runbooks with checks** — every step an action, a command and an expected
  result; the safe mitigation first.
- **Incidents with roles and a document** — commander, operations and
  communications named; a timeline in UTC written as it happens; a declared
  end.
- **Blameless postmortems with owned actions** — impact in SLO terms,
  contributing factors rather than a culprit, and every action with an owner,
  a priority and a ticket.

It owns incident handling as well as SLOs: the 2026-09-24 expansion plan
(decision D18) folded the incident commander into this expert rather than
writing two that overlap.

## What it fits

- A service that has users and no written SLO, or an SLO nobody can compute.
- Reviewing alert rules, especially a pager that fires often and helps rarely.
- During an incident: the roles, the document, mitigate-first.
- After an incident: the postmortem and whether its actions are closed.
- Any stack. The expert names no language; the example queries are
  Prometheus, and the checks are about the documents, not the backend.

## What it does not fit

- **Instrumenting the service** — which metrics, spans and logs exist, their
  cardinality, sampling and correlation. That is the observability engineer
  (drafted in the same round); this expert consumes the metrics and says
  which SLI they must support.
- **Making it faster** — `performance-engineer`.
- **The delivery pipeline and rollback mechanics** — `devops-platform-engineer`,
  which also has an SLO-and-alerting checklist at the level a platform
  engineer needs; this expert goes further on the SLO file, the budget
  policy, the incident and the postmortem.
- **Security incident investigation.** It recognises one, preserves the
  evidence, and hands over to `security-reviewer` under NIST SP 800-61 Rev. 3.
- **A system with no users yet.** Write the SLO when there is somebody to
  agree it with; before that it is a guess.

## Pros and cons

**In its favour:** every artefact has required fields a reviewer can check —
a query pair, a window, two alert windows, an expected result per runbook
step, an owner per action. It uses the published Google SRE practice and an
open specification rather than a vendor's format.

**Against it:** an error budget policy is an organisational agreement, and an
expert cannot make a product owner sign one. OpenSLO is a specification with
a small tooling ecosystem; a team on a vendor SLO product may keep the vendor
format and apply the same checklist to it. And the burn-rate numbers assume a
30-day window and meaningful traffic; low-traffic services need the
adjustments BR7 asks to be written down.
