# Changelog

## 1.0.1 — 2026-10-06

- **The overview says what Scenario D measured, including the part that does not
  flatter it** ([report](../../docs/research/2026-10-06-scenario-d.md)). Six
  runs: against the protocol's own measures — false completions, collisions,
  rejected work — this expert is not better than the same task done without it,
  because all three were zero everywhere and no run split the work. It cost
  roughly twice as much. What it did do, once, was spend its one subagent on an
  independent reviewer that found three defects the acceptance checks do not ask
  about. No content changed; the claim the overview makes for itself did.

## 1.0.0 — 2026-09-24

Seven principles for work split across several agents, adopted as content
rather than as a runtime ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).

- **Decide whether to split before splitting.** Count the width of the task
  graph; a job with none stays with one agent.
- **One source of truth.** The request is kept verbatim, the spec has section
  identifiers, and workers receive files and sections rather than summaries.
- **An assumption log**, and no critical assumption reaches a worker before the
  user has seen it.
- **Contract first.** Shared interfaces are frozen before parallel work starts;
  a change to one stops the branches that depend on it.
- **Ownership.** Every task names the paths it may write, and no two overlap.
- **One thin slice first**, verified and shown to the user.
- **The worker never verifies its own work.** Verify commands are run again,
  their output kept, and "done" said only when every task is verified.
- **A budget per task**, and a blocked task goes to the user rather than being
  closed quietly.

Three checklists, twelve refusals, and an example plan followed from start to
finish.

`provenance: generated`: written from published research on how multi-agent
systems fail. `agents: [claude-code]` rests on one run — writing the example
plan — and the overview says exactly what that did and did not show. Scenario D
is the real test.
