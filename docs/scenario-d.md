# Scenario D — does splitting the work help?

A measurement, not a feature. [ADR 0014](decisions/0014-crew-runtime-deferred.md)
deferred a multi-agent runtime until something shows it would be worth
building. This is the something: one task, done three ways, measured the same
way each time.

Nothing here is automated, and nothing needs code from this repository beyond
what is already published. It needs an agent that can run subagents, a clean
session per run, and a person with a stopwatch and a notebook.

> **Write the acceptance checks before the first run.** They go in the report
> unchanged. Checks written after watching a run are checks that run passes.

---

## The three configurations

| Run | Setup                                                                                      | What it isolates                     |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| D1  | One agent, no subagents                                                                    | the baseline                         |
| D2  | One lead agent, told it may split the work across subagents; nothing else                  | what splitting does on its own       |
| D3  | As D2, with the `technical-program-manager` expert installed and named in the first prompt | what the principles add to splitting |

Same agent, same model, same version, same starting project and the same first
prompt apart from D3's one extra sentence. Record all four.

## The task

Start from a blueprint that already has an objective finish line, so the
result can be judged by commands rather than by taste. The reference task:

> Starting from `ts-http-service`, add two resources — `projects` and `tasks`,
> where a task belongs to a project — each with create, read, list and delete,
> input validation, and tests for every route including the refusals. Every
> new route requires a token.

Why this one: two resources that share a relationship are the smallest job
where parallel work can collide, which is the failure the principles exist
for. And the blueprint's route-table test already fails if a route is left
public, so one of the checks is free.

A different task is fine if it has the same two properties: parts that could
be done in parallel, and a shared interface between them.

## Acceptance checks

Written down first, run **by the person, after the agent says it is done** —
never taken from the agent's own report. That rule is P2, and the experiment
is held to it too.

For the reference task:

1. `npm test` passes, with at least one test per route and per refusal
2. The route-table test passes: no new route is public
3. Deleting a project that has tasks does what the agent's own design says it
   does, and a test proves it
4. `npm run build` and the linter pass with no new suppressions
5. A request with a malformed body to each create route answers 400, not 500

## What to record

| Measure               | How                                                                               |
| --------------------- | --------------------------------------------------------------------------------- |
| Wall time             | first prompt to the agent saying it is done                                       |
| Tokens / cost         | the agent's own usage report for the session                                      |
| Checks passed         | out of the five, run by you                                                       |
| **False completions** | times the agent said done and a check failed — the number P2 is about             |
| Rework                | times a subagent's result was discarded or redone                                 |
| Collisions            | edits to the same file by two subagents, or one undoing another                   |
| Interventions         | every time you had to say something that was not an answer to a question it asked |
| Assumptions surfaced  | questions it asked you before building, and whether they were the right ones      |

One run per configuration is an anecdote. Two is the minimum worth writing
down; say which it is.

## Reading the result

- **D2 worse than D1** is a real and likely finding: splitting costs tokens and
  coordination, and a small task may not repay it. Say so.
- **D3 better than D2** on false completions, collisions or rework is the
  evidence ADR 0014 names. If what went wrong in D3 is something a
  deterministic check would have caught, that is the argument for writing that
  check — and only that one.
- **D3 no better than D2** means the expert is not earning its place, and its
  overview says so until a run shows otherwise.

Whatever it shows goes on the record: a dated report in `docs/research/`,
linked from the expert's overview and from ADR 0014. Measured, not promised.
