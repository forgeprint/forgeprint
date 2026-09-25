# AppSec Audit Crew

_Assembled by @aliosmanmho_

Four experts for a deep security and privacy audit of a whole application: a
threat model and ASVS 5.0 requirements first, a purpose, a retention period
and a tested deletion path for every personal field, the code reviewed against
both, and a test for every control that goes red when the control is removed.
Nothing in it attacks a running system; the penetration-tester role was refused
as dual-use ([expansion plan](../../docs/research/2026-09-24-expansion-plan.md),
D7 and D8).

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                            | What it brings                                                                        | The question it asks first                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`appsec-engineer`](../../experts/appsec-engineer/SKILL.md)       | The threat model, and security requirements that each name an ASVS control and a test | What are we protecting, from whom, and which control says so |
| [`privacy-engineer`](../../experts/privacy-engineer/SKILL.md)     | A data inventory, retention, a tested deletion path, DPIA triggers checked            | What is this personal field for, and how is it deleted       |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)   | The code read against the boundaries and authorization, each finding with a control   | Where does the code not do what the requirement says         |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md) | A test per control, deterministic, in the gate                                        | Does this test go red when the control is removed            |

**Two checkers.** The security reviewer checks the code against the appsec
engineer's requirements and the privacy engineer's inventory; the QA lead
checks that every control has a test that fails without it. Legal conclusions
go to counsel — the privacy engineer names the question, not the answer.

## What they install

| Integration                                             | Why this crew wants it                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`github-mcp`](../../integrations/github-mcp/README.md) | The code, dependency alerts, the workflow permissions and the findings as issues |

Third-party software with real permissions: the token reaches every repository
it can see. Read its README first. Security findings are sensitive — file them
where the project's security policy says, not in a public issue.

## The order they are useful in

1. **AppSec engineer first**: the threat model and the requirements, before
   anybody reads code for bugs.
2. **Privacy engineer second**: the data inventory, purposes, retention,
   deletion paths and the DPIA triggers, and the privacy threats added to the
   same model.
3. **Security reviewer third**: the code against both, boundaries first, then
   authorization, then secrets and dependencies.
4. **QA lead last**: a test per control, each seen failing with the control
   removed.

They disagree in two places, and the disagreement is useful:

- The appsec engineer wants security events logged; the privacy engineer
  wants personal data out of the logs. Log the event and a pseudonymous
  reference, not the person.
- The security reviewer raises a finding the requirements do not cover. It
  gets a requirement with an ASVS control first, then a test. A finding with
  no control stays out, as the reviewer's own rule says.

## Why four, and how this differs from API hardening

- MAST (Cemri et al.) found a fifth of multi-agent failures in verification and
  a verification step worth +15.6%. Every requirement here ends in a test
  another member confirms fails without the control.
- Kim et al. measured errors amplified 17.2 times across independent agents.
  The members work in order on one model of the system, not in parallel on
  separate ones.
- The [`api-hardening-crew`](../api-hardening-crew/README.md) hardens one API
  already in production, in an afternoon. This crew audits the whole
  application, privacy included, and writes the requirements first.

## Where this crew is wrong

- **Hardening a single API.** That is `api-hardening-crew`.
- **Compliance paperwork or legal conclusions.** The crew names the questions;
  counsel answers them.
- **A penetration test.** Nothing here probes a live system.
- **One known finding in one file.** Small, sequential work for the security
  reviewer alone.

## How to use it

Ask your agent for the crew by name, and let the threat model exist as a file
before any member reads code for bugs.
