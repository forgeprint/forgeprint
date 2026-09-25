# Incident Response Crew

_Assembled by @aliosmanmho_

Four experts for a production incident with users on the other end of it:
mitigate against the SLO, find the signal that shows what happened, prove the
root cause with a reproduction, and close on a regression test and a blameless
postmortem with owned actions. One site reliability engineer owns the incident
from page to postmortem; there is no separate incident commander
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D18).

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                          | What it brings                                                     | The question it asks first                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| [`site-reliability-engineer`](../../experts/site-reliability-engineer/SKILL.md) | Incident handling against the SLO, the runbook, and the postmortem | How much budget is burning, and what stops the burn now |
| [`observability-engineer`](../../experts/observability-engineer/SKILL.md)       | Traces, logs and metrics that join on one id                       | Can we follow one failing request from edge to database |
| [`debugger`](../../experts/debugger/SKILL.md)                                   | A committed reproduction, one refutable hypothesis at a time       | Can we make it fail on purpose                          |
| [`test-engineer`](../../experts/test-engineer/SKILL.md)                         | The regression test that failed before the fix and passes after    | Does this test fail on the version that broke           |

**The checking role is `test-engineer`.** The debugger finds the cause and
writes the fix; the test engineer confirms the regression test fails on the
broken version for the expected reason and passes on the fixed one. A fix whose
test was never seen failing is not closed.

The competing-hypotheses pattern — several investigators on one incident — is
not four members. It is the debugger's hypothesis log, run more than once if
the agent can; identical investigators are not a crew.

## What they install

| Integration                                               | Why this crew wants it                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`sentry-mcp`](../../integrations/sentry-mcp/README.md)   | The actual error with its stack trace and the release it started in                 |
| [`grafana-mcp`](../../integrations/grafana-mcp/README.md) | Dashboards, alert rules and read queries, to see the burn and where it comes from   |
| [`github-mcp`](../../integrations/github-mcp/README.md)   | The deploy that correlates, the revert, and the postmortem's action items as issues |

All three are third-party software with real reach. Sentry can assign and
resolve issues and its events routinely hold user data; Grafana is read-only
here, with its write tools not registered; the GitHub token reaches every
repository it can see. Read each README before an incident, not during one.

## The order they are useful in

1. **Site reliability engineer first**: declare, assign the roles the runbook
   names, and mitigate — roll back, shed load, fail over. Mitigation is not a
   fix, and it comes before the root cause.
2. **Observability engineer second**, on the rolled-back or degraded system:
   the trace of one failing request, the log lines on its trace id, the metric
   that moved first.
3. **Debugger third**: a reproduction committed before any fix, hypotheses
   written down and refuted one at a time, a root cause that explains every
   symptom.
4. **Test engineer fourth**: the regression test seen failing, then passing.
5. **Site reliability engineer last**, again: the blameless postmortem, each
   action with an owner and a date.

They disagree in two places, and the disagreement is useful:

- The SRE wants to roll back now; the debugger wants the failing state kept to
  reproduce. Mitigation wins while users are affected. Capture what the
  observability engineer can before rolling back, and reproduce against the
  broken version afterwards.
- The observability engineer will want to add instrumentation mid-incident.
  Change nothing that is not mitigation while the incident is open; the gaps go
  into the postmortem as actions.

## Why four, in sequence

- Kim et al. measured sequential work getting 39% to 70% worse with more agents
  and errors amplifying 17.2 times across independent ones. An incident is
  sequential once mitigated, so the members hand over in order; they do not
  race.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The regression test seen failing is that verification, made concrete.

## Where this crew is wrong

- **A bug found in development with no production impact.** Take the debugger
  alone.
- **Capacity planning.** Nothing is broken; the SRE and the performance
  engineer answer that.
- **A one-file fix whose cause is already known.** Sequential, small work: fix
  it with a regression test and move on.

## How to use it

Keep this crew named in the runbook before anything breaks. When it does, ask
your agent for it by name and start with the SRE's first question.
