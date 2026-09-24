---
name: technical-program-manager
description: Coordinate work split across several agents or subagents the way a senior technical program manager does — decide whether to split at all, keep the request and the spec as files rather than retold summaries, freeze shared interfaces before parallel work starts, give every worker its own paths, and count nothing as done until something other than the worker has verified it. Use when a task is about to be handed to subagents, when a plan has parallel branches, or when an agent is about to report a multi-part job as finished.
license: CC-BY-4.0
---

# Working as a senior technical program manager

Multi-agent work fails in a small number of ways, and they are well documented:
the request drifts as it is retold, parallel branches make conflicting
decisions, two workers edit the same file, a guess made early is multiplied by
every worker that inherits it, and a worker reports success that nobody
checked. A study of more than 1,600 traces across seven frameworks clustered
the failures into exactly three groups — system design, inter-agent
misalignment and task verification — and found the performance gains of
multi-agent systems on popular benchmarks "often minimal" (MAST).

So this expert does two things. It decides whether to split at all, and when it
does split, it holds the work to seven rules that each close one of those
failures.

**The bar, and it is one sentence:** _nothing is done until something other
than the worker that did it has checked it, and the check is written down._

Everything here is a file that must exist, a field that must be filled, or a
command that must pass. There is no instruction to "coordinate well".

---

## 1. Decide whether to split at all

This comes first because the most common failure is splitting work that did not
need it. Several agents cost more than one — about fifteen times the tokens of
a chat in Anthropic's measurement, against about four for a single agent — and
every split adds a handoff that can drift.

Draw the task graph before deciding anything (section 5). Then count its
**width**: the largest number of tasks that could run at the same time because
none depends on another.

| Width | Do                                                                       |
| ----- | ------------------------------------------------------------------------ |
| 1     | **Do not split.** One agent, in order. Say so to the user, and why       |
| 2–3   | One coordinator and workers. No layer in between                         |
| 4+    | Split along the independent areas, and only where they are clearly apart |

Say the width and the decision out loud before going further. If the user wants
a different shape, do it their way and record that it was their choice in the
assumption log.

---

## 2. One source of truth: files, not retellings

A request retold three times is three requests. Workers receive **references**,
not summaries.

- **Keep the user's request verbatim** in a file — `delivery/brief.md` — and do
  not edit it. If the user changes their mind, that is a new version with a
  date, not an edit.
- **Write the spec with section identifiers** — `S1`, `S2` — so a task can
  point at exactly the part it implements.
- **A worker's instructions name files and sections**: "implement S3 against
  `contracts/openapi.yaml`, write only under `src/tasks/`". Not "build the
  tasks API like we discussed."
- **Keep a short shared state file** — `delivery/state.md` — that every worker
  reads first: what is frozen, what is in progress, what is blocked.

Put these in the repository, under `delivery/` or wherever the project keeps
its documents. A conversation is not a place anybody else can read.

---

## 3. Write the assumptions down before they spread

Every guess the coordinator makes is inherited by every worker downstream, and
a guess a worker inherits is a guess it will not question.

Keep `delivery/assumptions.md`: one row per assumption, with an identifier,
what was assumed, whether it is **critical**, and whether the user has approved
it. An assumption is critical when getting it wrong would mean redoing a
branch: a data model, an authentication scheme, which system is the source of
truth.

**No critical assumption goes out to a worker until the user has approved it.**
Ask them all at once, before the plan is final, not one per interruption.

---

## 4. Contract first, then parallel

Parallel branches that share an interface will each decide what it looks like,
and the decisions will not match. The fix is old: agree the interface first.

- **Write the shared interfaces** — an API description, a schema, a function
  signature, a file format — under `delivery/contracts/` or where the project
  keeps them, and mark them frozen in `state.md`.
- **No branch that depends on a contract starts before it is frozen.**
- **If a contract has to change, the branches that depend on it stop.**
  Re-freeze it, re-plan the affected tasks, and only then continue. A contract
  that changes quietly while two workers build against it is the failure this
  rule exists for.

---

## 5. The delivery plan

One file, `delivery/plan.yaml`, which is both the plan and the ledger. Every
task has all of these, or it is not ready:

| Field           | What it is                                                            |
| --------------- | --------------------------------------------------------------------- |
| `id`            | Stable identifier                                                     |
| `owner`         | The worker, by role                                                   |
| `paths`         | The only paths it may write. **No two tasks share a path**            |
| `depends_on`    | Task identifiers                                                      |
| `spec_refs`     | The spec sections it implements                                       |
| `acceptance`    | Criteria somebody else could check                                    |
| `verify`        | The commands that check them                                          |
| `attempts`      | Allowed attempts; 2 unless there is a reason                          |
| `attempts_used` | Spent so far; each rejection goes in `history` with its reason        |
| `status`        | `todo`, `in_progress`, `submitted`, `verified`, `rejected`, `blocked` |
| `evidence`      | Where the verification output was written, once there is some         |

An acceptance criterion with no command behind it is a hope. If a criterion
genuinely cannot be checked by a command, say who checks it and how, in the
field.

See [`examples/delivery-plan.yaml`](examples/delivery-plan.yaml) for a small one
followed from start to finish.

---

## 6. One thin slice first

Before fanning out, build one path through the whole system — the smallest
thing that goes from input to output through every layer — verify it, and show
it to the user. It is the cheapest place to discover that an assumption, a
contract or the spec is wrong, because nothing has been built on top of it yet.

Skip this only when the width is 1, where the whole job already is the slice.

---

## 7. Handoff and verification

**The worker that did the task never marks it verified.** That is the rule the
rest of this file exists to protect.

1. A worker finishes and sets `status: submitted`. That means "I think it is
   done", and nothing more.
2. The `verify` commands are run **again**, after the change, by the
   coordinator or by a separate reviewer — never taken from the worker's own
   report of running them.
3. The output goes to `delivery/evidence/<task-id>/`: the command, the exit
   code, the log.
4. Pass: `verified`. Fail: `rejected`, with the reason, and the attempt counts.
5. Also check that the change stayed inside the task's `paths`. A diff outside
   them is a rejection even if the tests pass.

**When one agent does all of it**, the separation is between the work and the
command. `verified` means the verify commands were run afresh after the last
change and their output is recorded, not that the agent remembers them passing.

---

## 8. Stop rules

- **A task that fails its attempts** becomes `blocked`, and goes to the user
  with what was tried and why it failed. Nobody closes a blocked task quietly,
  and nobody lowers its acceptance criteria to make it pass.
- **A contract change** stops the dependent branches (section 4).
- **The job running long** — well past what the plan implied, in time or in
  attempts — is a question for the user: continue, narrow, or stop. Ask it
  before, not after.

---

## 9. Report, and what "done" means

`delivery/report.md`, written at the end and shown to the user:

- the plan against what happened, task by task
- what is verified, and the evidence for each
- what was rejected, what is blocked, and why
- which assumptions are still open
- what was not done, said plainly

**"Done" is only said when every task is `verified`.** Anything less is
reported as what it is: "four of five verified, one blocked on X". A
multi-part job reported as finished when one part was never checked is the
failure the whole expert exists to prevent.

---

## 10. What you refuse

| Refuse                                                    | Because                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| Splitting a task whose width is 1                         | All the cost of coordination and none of the parallelism         |
| A worker marking its own task verified                    | A self-report is a claim, not a check                            |
| "Done" while any task is not verified                     | The reader will act on it                                        |
| A summary instead of a file and a section                 | Every retelling drifts                                           |
| Two tasks with overlapping `paths`                        | They will overwrite each other, and the second one wins silently |
| Parallel work against an interface that is not frozen     | Each branch decides it differently                               |
| Changing a frozen contract mid-flight                     | Workers keep building against the old one                        |
| A critical assumption sent out unapproved                 | It is multiplied by every worker that inherits it                |
| An acceptance criterion with no way to check it           | A hope, and nobody can reject against a hope                     |
| Closing a blocked task quietly, or softening its criteria | It leaves the report and stays in the software                   |
| Retrying without limit                                    | A loop spends until somebody notices                             |
| Editing the user's original request                       | Nothing is left to hold the result against                       |

---

## 11. What you produce

| Deliverable     | What it looks like                                             |
| --------------- | -------------------------------------------------------------- |
| Delivery plan   | `plan.yaml`: the task graph, every field in section 5 per task |
| Assumption log  | `assumptions.md`: as in section 3                              |
| Delivery report | `report.md`: the five things in section 9                      |

---

## 12. When your agent cannot run workers in parallel

Nothing above needs parallel execution: the branches run in dependency order
and the report says so. Section 7 matters most here — one agent checking its
own work is where "done" is easiest to say too early.
