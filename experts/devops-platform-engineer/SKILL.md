---
name: devops-platform-engineer
description: Build and review a delivery pipeline and its runtime the way a platform engineer does — pin everything by digest, give the build the least privilege that works, make rollback a tested path rather than a hope, and define the SLO before the dashboard. Use when writing CI, containerising a service, planning a release or a rollback, or when an agent is about to pin an action by tag.
license: CC-BY-4.0
---

# Working as a platform engineer

The pipeline is the most privileged thing in most organisations. It has write
access to the artifact registry, credentials for production, and it runs code
from every pull request. It is also the part nobody reviews, because it is
"just YAML".

This skill treats it as what it is: a production system that happens to be
written in configuration. Everything below is checkable, by a file, a command
or a deliberate failure.

---

## 1. Everything is pinned, and pinned means by digest

A tag is a pointer somebody else can move. Pinning by tag means a third party
can change what runs inside your build, with your credentials, after your
review passed.

- **CI actions are pinned to a full commit SHA**, with the version in a
  trailing comment so a human can read it:
  `uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0`
- **Base images are pinned by digest**, not by tag. `FROM node:22-alpine` is a
  moving target; `FROM node:22-alpine@sha256:...` is a build.
- **Dependencies have a committed lockfile**, and the install step uses the
  lockfile mode that fails on drift rather than the one that resolves.
- **Tool versions are explicit** — in a version file, or in the workflow. "The
  runner's default" is a version somebody else chooses and changes.

The counter-argument is that pinning by digest makes updates manual. The answer
is a bot that raises pull requests, not a floating tag: the update should be a
change somebody reviews, which is exactly what a moving tag prevents.

See [`checklists/pipeline-integrity.md`](checklists/pipeline-integrity.md).

---

## 2. The build has the least privilege that works

Two failures here, and the second is the one that turns a public repository
into a credential leak.

- **Declare permissions explicitly and narrowly**, per job rather than per
  workflow. The default is whatever the platform decided, and it is broader
  than what you need.
- **A pull request from a fork must not reach a secret.** Choose the trigger
  that runs without them. If a job genuinely needs a secret and untrusted code,
  it needs to be two jobs with an approval between them.
- **Never interpolate untrusted input into a shell step.** A branch name, a
  pull request title and an issue body are attacker-controlled strings; put
  them in an environment variable and quote it, never inline them into the
  script.
- **Prefer short-lived federated credentials** over stored long-lived secrets
  wherever the target supports it.
- **A secret that has ever been printed is burned.** Rotate it; masking is not
  deletion, and the logs are somewhere.

See [`checklists/secrets-in-ci.md`](checklists/secrets-in-ci.md).

---

## 3. The image is part of the design

- **Non-root.** A `USER` line that is not root, and a filesystem the process
  cannot write to except where it must.
- **Multi-stage**, so the build toolchain does not ship. A compiler in a
  production image is a tool waiting for somebody else to use it.
- **No secret in a layer.** Not in an `ARG`, not in an `ENV`, not in a file
  deleted by a later layer — the layer is still there.
- **A `.dockerignore` that excludes `.git`, the environment files and the local
  configuration.** Without it the build context carries the whole history.
- **One process, and signals handled**, so the orchestrator can stop the
  container rather than killing it.
- **A health check the orchestrator uses**, distinct from liveness where the
  platform distinguishes them.

See [`checklists/container-image.md`](checklists/container-image.md).

---

## 4. Rollback is a tested path, not a hope

The largest behavioural change here. "We can roll back" is believed by every
team and true for fewer than half.

- **Every release states how it is rolled back**, and the statement is specific:
  which command, how long it takes, and what it does not undo.
- **What a rollback does not undo is the important half.** A schema migration,
  a consumed message, a sent email, a charged card. The release plan names
  these before the release, not during the incident.
- **Deploy and release are separate.** Shipping code and turning behaviour on
  are two decisions; a feature flag makes the second one reversible in seconds
  rather than in a deploy cycle.
- **The rollback has been performed, in a non-production environment, by
  somebody following the written steps.** A procedure nobody has executed is a
  draft.
- **Forward-only is a legitimate choice** — say so explicitly, and then the
  plan is about how fast a fix can ship instead.

See [`checklists/rollout-and-rollback.md`](checklists/rollout-and-rollback.md).

---

## 5. The SLO comes before the dashboard

A dashboard with forty panels answers no question. Start from the other end.

- **Name the user journey**, then the indicator that reflects it. Availability
  and latency of the thing the user actually does — not CPU, not memory.
- **Set the objective as a number with a window**, and derive the error budget
  from it. "99.9% of requests under 400ms over 28 days" is an objective; "fast"
  is not.
- **Alert on symptoms, not causes.** Page when users are affected or the error
  budget is burning fast. High CPU is a cause, and most of the time it is a
  cause of nothing.
- **Every page has a runbook** that names the first three things to check. A
  page with no runbook is a page that wakes somebody to read code at 3am.
- **An alert that has fired ten times and been acknowledged ten times is
  deleted or fixed.** It is training everybody to ignore the class it belongs
  to.

See [`checklists/slo-and-alerting.md`](checklists/slo-and-alerting.md).

---

## 6. What you refuse

| Refuse                                            | Because                                                   |
| ------------------------------------------------- | --------------------------------------------------------- |
| An action pinned by tag or branch                 | A third party can change what runs in your build          |
| `FROM image:tag` with no digest                   | The build is not reproducible and not reviewed            |
| A workflow with no explicit `permissions`         | The default is broader than you need                      |
| A secret reachable from a fork's pull request     | Arbitrary code execution with your credentials            |
| Untrusted input interpolated into a shell step    | Script injection through a branch name or a title         |
| A container running as root                       | No isolation left if the process is compromised           |
| A secret in an image layer or a build argument    | The layer persists after the file is deleted              |
| A download piped into a shell                     | Downloads and executes in one unreviewable step           |
| `latest` anywhere                                 | A deploy that is not the deploy you tested                |
| A release plan with no rollback statement         | "We can roll back" is believed more often than it is true |
| A page with no runbook                            | Wakes somebody to read code at 3am                        |
| A dashboard built before an SLO                   | Forty panels and no question answered                     |
| Manual steps in a production change, undocumented | The person who knows them will be on holiday              |

---

## 7. What you produce

| Deliverable         | What it looks like                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Infrastructure plan | What runs where, how it is provisioned, what is stateful, and what the blast radius of each component is |
| Release plan        | The rollout, the rollback with its cost, what the rollback does not undo, and the go/no-go signal        |
| Runbook             | Per alert: what it means, the first three checks, the usual cause, and who to escalate to                |
| SLO definition      | Indicator, objective, window, error budget, and what happens when the budget is spent                    |
| Observability plan  | What is instrumented, what is sampled, what is retained and for how long                                 |
| Cost review         | Where the spend is, what drives it, and which change would reduce it most                                |

An infrastructure plan without blast radius is a diagram. The question it has
to answer is what stops working when each box does.

---

## 8. How to review a pipeline

1. **Read the triggers first.** Which events run this, and does any of them run
   untrusted code with access to a secret? Everything else is secondary to that
   answer.
2. **Read the permissions block.** Absent means default; default is too much.
3. **Grep for unpinned things** — actions by tag, images without a digest,
   `latest`, an install that resolves rather than reads a lockfile.
4. **Grep for interpolation into `run:` steps**, and check whether each source
   is attacker-controlled.
5. **Find the deploy step** and ask what credential it holds, how long that
   credential lives, and what it can reach beyond this service.
6. **Ask for the last rollback.** When was one last performed, by whom,
   following what document. "We have never needed to" is the answer that means
   the procedure is untested.
7. Report findings as `critical | high | medium | low`, each with the file, the
   line, the control, and the fix.

Step 6 is the one people are least able to answer and the one that predicts the
worst outage.
