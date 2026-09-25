# Application Security Engineer

## What it changes

Asked to "make it secure", an agent adds input validation where it happens to
be looking and promises the rest in a review. This expert moves the work to
before the code, and leaves files behind that later work is checked against:

- **A threat model in the repository, answering four questions.** A data-flow
  diagram with trust boundaries, STRIDE applied per element that crosses one,
  an ID and exactly one response per threat, and a list of what triggers a
  revisit.
- **Requirements from OWASP ASVS 5.0 at a stated level.** Per feature, the
  requirement IDs that apply and the ones that do not, each written as an
  observable outcome a test can fail.
- **The documentation ASVS asks for up front.** Authorization rules, input
  validation rules, key management, secrets, remediation time frames, the
  SBOM, the logging inventory — written before the feature that needs them.
- **A scanning policy, not just scanners.** Secret, dependency and SAST scans
  pinned in CI, with which severities fail, a deadline per severity, a named
  triage owner, and suppressions that expire.
- **A test per requirement, in the project's own suite.** Named for the ASVS
  ID, negative cases first, an authorization matrix, and the WSTG test ID the
  method comes from.

Five checklists — threat model, security requirements, design documentation,
scanning policy, security tests — and eight refusals.

## What it fits

- A new system or a new feature, before the design is fixed.
- A backlog that needs security acceptance criteria rather than a separate
  security backlog nobody schedules.
- Setting up secret, dependency and SAST scanning with a policy that says what
  the findings mean.
- A multi-tenant or role-heavy application, where the authorization matrix and
  the cross-tenant test carry most of the value.
- Any stack. Nothing is tied to a language; the scanner names are examples.

## What it does not fit

- **Reviewing a change or a finished codebase.** That is
  [`security-reviewer`](../security-reviewer/SKILL.md). The line between them
  runs in both directions: this expert produces the threat model and the
  requirements up front; the security reviewer checks a change against them,
  and a threat the review finds that the model missed comes back here as a
  model update. Neither replaces the other.
- **Penetration testing, red teaming, exploit development.** Refused, as
  dual-use (D8 in the 2026-09-24 expansion plan). It will not scan, fuzz or
  attack any system, including one the user says they own, and it will not
  write a payload or a proof of concept. Verification is by review and by
  tests in the project's own suite.
- **Privacy.** Personal-data inventories, retention, DPIAs and lawful bases
  belong to a planned privacy-engineer expert.
- **CI and runtime hardening.** Runners, workflow permissions and image pinning
  belong to [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Compliance certification.** An ASVS level claimed here is a requirement
  list with tests, not an audit.

## Pros and cons

**In its favour:** every artefact is cross-referenced — threat to requirement,
requirement to test — so a missing link is found with a grep, not a meeting.
It uses a part of ASVS 5.0 that is easy to miss: the documentation
requirements that open many chapters, which are precisely the design decisions
a team otherwise makes by accident in code review.

**Against it:** it front-loads effort. A threat model with STRIDE per element
takes real time, and on a prototype that will be thrown away the cost is not
worth it. Its refusal to test against running systems means some weaknesses —
misconfiguration in a deployed environment, for example — are outside what it
can verify; it says so rather than pretending otherwise. And it has not been
run on a real project by a person; `provenance: generated` is the honest label.
