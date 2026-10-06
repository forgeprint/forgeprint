# Scenario D, round 2 — recording sheet

One copy per run, in [`runs/`](runs). **Nine runs: D1, D2, D3, three each**,
because round 1 ran two and D3's two did not behave the same way as each other
([the report](../../research/2026-10-06-scenario-d.md) says so in its first
paragraph).

## The run

|                       |                                                                      |
| --------------------- | -------------------------------------------------------------------- |
| Configuration         | D1 / D2 / D3                                                         |
| Attempt               | a, b or c                                                            |
| Date                  |                                                                      |
| Agent, model, version | all three, exactly — they have to match across runs                  |
| Starting project      | the frozen round-2 baseline's commit                                 |
| Prompt file           | `prompt-d1.md` / `prompt-d2.md` / `prompt-d3.md`, read from the file |
| Turns                 | one, or two under the [answer policy](reply.md)                      |

## Measures

| Measure                         | Value | How                                                                             |
| ------------------------------- | ----- | ------------------------------------------------------------------------------- |
| Wall time                       |       | first prompt to the agent saying it is done                                     |
| Turns                           |       | the session's own count                                                         |
| Tokens / cost                   |       | the session's own usage report                                                  |
| Checks passed                   | /12   | the eleven scripted below plus check 3, run by you after it says it is done     |
| **False completions**           |       | times it said done and a check failed — the number ADR 0014 turns on            |
| **Subagents spawned**           |       | from `subagent_stats`, **and what each was for**: a worker, or a reviewer       |
| **Resources given to a worker** | /4    | how much of the task was actually split. Round 1's answer was 0 of 2, six times |
| Rework                          |       | times a subagent's result was discarded or redone                               |
| Collisions                      |       | two workers editing `src/app.ts`, or `src/body.ts`, or one undoing the other    |
| Interventions                   |       | anything said that is not the policy reply; expected 0                          |
| **Decisions surfaced**          |       | decisions the run named, asked or recorded ([reply.md](reply.md))               |
| **Decisions settled silently**  | /5    | of the five the task leaves open                                                |
| Test assertions                 |       | the `note` line in `checks.sh`                                                  |

The four measures in bold are the ones round 2 exists to move. Round 1 scored
zero on three of them in all six runs, not because the configurations tied but
because no run ever split the work — so collisions and rework had no
opportunity to happen.

## Checks

The scripted ten, which are not yours to interpret:

```bash
bash docs/scenario-d/round-2/checks.sh <run-dir> <baseline-dir>
node docs/scenario-d/round-2/check-app.mjs <run-dir>
```

| #   | Check                                                              | Result |
| --- | ------------------------------------------------------------------ | ------ |
| 0   | `src/` changed at all                                              |        |
| 0b  | 19 routes declared, four per resource                              |        |
| 1a  | `npm test` passes                                                  |        |
| 1b  | no test file buried below `src/`                                   |        |
| 1c  | more assertions than the baseline's 14                             |        |
| 2   | the route-table test ran and passed — no new route is public       |        |
| 4a  | `npm run build` passes                                             |        |
| 4b  | no new `@ts-ignore` or `@ts-expect-error`                          |        |
| 5   | a malformed body to each create route answers 4xx, never 5xx       |        |
| 6   | a declared type is type-tested, not coerced                        |        |
| 7   | a refusal names what the route accepts, never what the caller sent |        |

Then the one that is yours.

**Check 3 — the four resources agree with each other, and with their own
design.** Read what the run decided for each of the five open decisions in
[`reply.md`](reply.md), for each of the four resources. Any answer can be
right. What is not right is four resources answering the same question
differently, or a design that says one thing and code that does another.

| Decision                     | projects | notes | tags | budgets | Agreed? | Test? |
| ---------------------------- | -------- | ----- | ---- | ------- | ------- | ----- |
| a second DELETE              |          |       |      |         |         |       |
| an id that never existed     |          |       |      |         |         |       |
| an unknown field in the body |          |       |      |         |         |       |
| uniqueness                   |          |       |      |         |         |       |
| the bounds of `limit`        |          |       |      |         |         |       |

A disagreement here is the headline finding of its run, and it is the one the
acceptance checks cannot see: twelve scripted checks pass on four resources
that contradict each other.

## Notes

Anything that will not fit a cell: what it split and why, what it decided not
to split and whether it said why, what the subagents were told, what you nearly
said and did not.
