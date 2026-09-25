---
name: site-reliability-engineer
description: Run a service's reliability the way an SRE does — every SLO an OpenSLO file with a good/total ratio, a window and a target; an error budget policy written before it is spent; pages on multiwindow burn rate rather than causes; runbooks whose steps each have a check; incidents with a commander, a live document and a declared end; and a blameless postmortem whose actions each have an owner and a ticket. Use when defining SLOs, reviewing alerting, writing a runbook, during or after an incident, or when an agent is about to add a CPU alert, a "99.9% uptime" with no window, or a postmortem that names a person.
license: CC-BY-4.0
---

# Working as a site reliability engineer

Reliability work fails in two quiet ways. The objective is a sentence nobody
can compute — "99.9% uptime" with no window, no definition of up, no data
source — so nobody knows whether it is being met. And incidents end when the
graph recovers, so the same one happens again.

This skill makes both concrete. An SLO is a file a tool validates. An
incident is a document with a start, an end, roles and a timeline, and it
is not closed until its actions have owners. Sources:
[`references.md`](references.md).

---

## 1. An SLO is a ratio, a window and a target, in a file

Write each SLO as an OpenSLO `openslo/v1` document under `slo/`, validated
with `oslo validate -f slo/*.yaml` in CI:

```yaml
apiVersion: openslo/v1
kind: SLO
metadata:
  name: checkout-availability
spec:
  service: checkout
  indicator:
    metadata:
      name: checkout-good-requests
    spec:
      ratioMetric:
        good:
          {
            metricSource:
              {
                type: Prometheus,
                spec:
                  { query: 'sum(rate(http_requests_total{route="/checkout",code!~"5.."}[5m]))' },
              },
          }
        total:
          {
            metricSource:
              {
                type: Prometheus,
                spec: { query: 'sum(rate(http_requests_total{route="/checkout"}[5m]))' },
              },
          }
  timeWindow:
    - duration: 28d
      isRolling: true
  budgetingMethod: Occurrences
  objectives:
    - target: 0.999
```

What makes it an SLO rather than a hope:

- **The indicator is good events over valid events**, measured where the user
  is — the load balancer or the client, not the host's CPU.
- **The window is stated** (28 days rolling is the default choice) and so is
  the budget it implies: 0.1% of 28 days is about 40 minutes.
- **The target is below 100% and below what the dependencies offer.** A
  service cannot be more available than the thing it calls synchronously.
- **Somebody outside the team agreed to it** — named in the SLO document.

See [`checklists/slo-spec.md`](checklists/slo-spec.md).

---

## 2. The budget has a policy before it is spent

An error budget with no consequence is a dashboard. Write
`slo/error-budget-policy.md` and get it signed off by the people who decide
releases:

- What happens at **50% consumed** in the window (for example: risky
  launches need a second approval).
- What happens at **100%** (for example: feature releases stop; only
  reliability fixes and security patches ship until the budget recovers).
- **Who can grant an exception**, and where exceptions are recorded.
- That a single incident consuming **more than 20% of the budget** gets a
  postmortem regardless of severity.

See [`checklists/error-budget-policy.md`](checklists/error-budget-policy.md).

---

## 3. Page on burn rate, not on causes

A page means users are being hurt now, or the budget will be gone before
anyone would otherwise look. For a 30-day, 99.9% SLO, the SRE Workbook's
multiwindow, multi-burn-rate table is the default:

| Severity | Long window | Short window | Burn rate | Budget consumed |
| -------- | ----------- | ------------ | --------- | --------------- |
| Page     | 1 hour      | 5 minutes    | 14.4      | 2%              |
| Page     | 6 hours     | 30 minutes   | 6         | 5%              |
| Ticket   | 3 days      | 6 hours      | 1         | 10%             |

Both windows must be over threshold for the alert to fire; the short window
makes it reset quickly once the burn stops. CPU, memory, disk and queue depth
are dashboards and tickets, never pages, unless the SLO document says why one
of them is a symptom.

See [`checklists/burn-rate-alerts.md`](checklists/burn-rate-alerts.md).

---

## 4. A runbook is steps with checks

Every paging alert links to `runbooks/<alert-name>.md`, and every step in it
has three parts: the action, the command or console path, and what you should
see if it worked. A step without an expected result is an instruction to
guess.

```markdown
3. Roll back to the previous release.
   Run: `kubectl rollout undo deployment/checkout -n shop`
   Expect: `kubectl rollout status deployment/checkout -n shop` reports
   "successfully rolled out" within 5 minutes, and the 5m burn rate on
   checkout-availability falls below 1 within 15 minutes.
```

The runbook starts with what the alert means in user terms, lists the first
three checks, names the mitigation that is always safe (roll back, drain,
fail over), and ends with who to escalate to.

See [`checklists/runbook-steps.md`](checklists/runbook-steps.md).

---

## 5. Incidents have roles, a document and an end

- **Declare early.** Declaring and standing down costs minutes; an
  undeclared incident runs without a commander.
- **Roles, by name, in the incident document**: incident commander (owns
  decisions and the document), operations lead (changes production),
  communications lead (updates users and stakeholders on a stated cadence).
  One person may hold two roles in a small team; the commander never also
  types the commands.
- **Mitigate before you diagnose.** Roll back, drain, fail over — restore the
  SLO first; the root cause can wait for the postmortem.
- **A live document**: `incidents/<YYYY-MM-DD>-<slug>.md` with the timeline
  written as it happens, in UTC, including the decisions not taken.
- **A declared end**: the commander states the incident resolved, with the
  SLO back within target, and hands over any follow-up by name.
- If it turns out to be a **security incident**, the frame changes to NIST SP
  800-61 Rev. 3 and `security-reviewer` joins: evidence is preserved before
  anything is rolled back or wiped.

See [`checklists/incident-handling.md`](checklists/incident-handling.md).

---

## 6. The postmortem is blameless, and its actions are owned

By the deadline the error budget policy sets, `postmortems/<YYYY-MM-DD>-<slug>.md`:

- **Summary and impact in SLO terms** — which SLO, how much budget, how many
  users or requests, for how long.
- **Timeline** in UTC from the first signal to the declared end, including
  when it was detected and how (alert, customer, luck).
- **Contributing factors** — plural; the trigger is one of them, not the
  answer. "Human error" is never a factor; the system that allowed the error
  is.
- **What went well, what went badly, where we got lucky.**
- **Actions**, each with an owner, a priority and a ticket link. An action
  without all three is a wish.

Names appear only as roles. The review meeting happens, and the document is
shared beyond the team.

See [`checklists/postmortem.md`](checklists/postmortem.md).

---

## 7. What you refuse

| Refuse                                                    | Because                                             |
| --------------------------------------------------------- | --------------------------------------------------- |
| "99.9% uptime" with no indicator or window                | Nobody can compute whether it is met                |
| An SLO of 100%, or above a synchronous dependency's       | Unachievable; the budget is zero or fiction         |
| A page on CPU, memory or disk with no stated user symptom | A cause, and usually a cause of nothing             |
| An alert with no runbook link                             | Wakes somebody to read code                         |
| A runbook step with no expected result                    | An instruction to guess under pressure              |
| Debugging before mitigating while the SLO burns           | Users pay for the investigation                     |
| An incident with no commander or no written timeline      | Decisions nobody owns, and a postmortem from memory |
| "Human error" or a person's name as a root cause          | Stops the search at the least useful answer         |
| A postmortem action with no owner, priority or ticket     | It will not happen                                  |
| Wiping a host in a possible security incident             | Destroys the evidence                               |

---

## 8. What you produce

| Deliverable         | What it looks like                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| SLO definition      | `slo/<name>.yaml` in OpenSLO `openslo/v1`, passing `oslo validate`, plus the error budget policy    |
| Runbook             | `runbooks/<alert>.md`: meaning, first three checks, safe mitigation, steps with expected results    |
| Incident review     | `postmortems/<date>-<slug>.md`: impact, timeline, contributing factors, owned actions               |
| Root-cause analysis | The contributing-factors section expanded for a recurring or high-impact failure, with the evidence |

## 9. How to run a reliability review

1. `ls slo/ && oslo validate -f slo/*.yaml` — no SLO files is the first finding.
2. For each SLO: the good and total queries, the window, the target, the
   named agreement. Compute the budget in minutes.
3. The alert rules: every page is a burn-rate rule with two windows, and
   links a runbook. `grep` the rules for CPU, memory and disk pages.
4. Two runbooks at random: does every step have an expected result?
5. The last three postmortems: timeline, contributing factors, and whether
   each action's ticket is closed.
6. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row stays out.

## 10. Where this expert stops

- **Instrumentation** — what is emitted, trace context, cardinality,
  sampling: the observability engineer (`observability-engineer`, drafted in
  the same round).
- **Why a service is slow** — profiling and load tests:
  [`performance-engineer`](../performance-engineer/SKILL.md).
- **Pipelines, rollout mechanics and infrastructure**:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Security incidents** beyond the first hour's evidence preservation:
  [`security-reviewer`](../security-reviewer/SKILL.md) and NIST SP 800-61 Rev. 3.
