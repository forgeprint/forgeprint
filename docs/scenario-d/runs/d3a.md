# D3, attempt 1 — 2026-10-06

Splitting allowed, with the `technical-program-manager` expert installed and
named. Prompt: [`prompt-d3.md`](../prompt-d3.md).

**Two turns**, under the [answer policy](../reply.md) that was written and
committed before it was used.

## Turn 1: it refused to guess

It wrote no code. It produced `delivery/brief.md`, `plan.yaml`,
`assumptions.md`, `contracts/api.md` and `state.md`, then stopped:

> I haven't written any code yet. Four decisions would mean redoing a branch if
> I guessed them wrong, so I need your answers on those first.

> **Should this be split across subagents?** No. I'll do it alone, in order […]
> A worker would cost more than it saves here.

The four decisions it surfaced included **A3: deleting a project that still has
tasks returns 409**, with cascade named as the alternative. That is precisely
the decision the four previous runs each made silently and inconsistently —
three cascaded, one refused. The expert's whole claim is that this class of
choice should be settled before work starts, and here it was.

Turn 1 also exposed a defect in the materials rather than in the run:
`checks.sh` reported **5 of 5 on a project with no implementation**, because
every assertion in it asked whether something had got worse. That is fixed —
`check 0` and `check 1c` now carry the floor — and the four earlier records read
7 of 7 instead of 5 of 5 with their verdicts unchanged.

## Turn 2: approved, and finished

The policy's reply, verbatim and nothing else:

```
Approved — proceed with all four proposals as written. Add nothing.
```

**The approved design held.** A3 was 409; `projects.ts` answers 409 and a test
asserts it: _"is 409 while the project has tasks, and keeps both"_.

## Measures

| Measure               | D3a                  | D1a    | D1b    | D2a    | D2b    |
| --------------------- | -------------------- | ------ | ------ | ------ | ------ |
| Wall time             | **207 s** (51 + 156) | 132 s  | 138 s  | 104 s  | 116 s  |
| Turns                 | **20** (6 + 14)      | 8      | 9      | 9      | 10     |
| Cost                  | **$1.369**           | $0.677 | $0.694 | $0.568 | $0.629 |
| Tokens out            | **22 046**           | 15 817 | 15 999 | 12 017 | 14 130 |
| Checks passed         | **7 of 7**           | 7 of 7 | 7 of 7 | 7 of 7 | 7 of 7 |
| **False completions** | **0**                | 0      | 0      | 0      | 0      |
| Subagents spawned     | **0**                | 0      | 0      | 0      | 0      |
| Rework / collisions   | 0 / 0                | 0 / 0  | 0 / 0  | 0 / 0  | 0 / 0  |
| Interventions         | **1, by policy**     | —      | —      | —      | —      |
| Assumptions surfaced  | **4**                | —      | —      | —      | —      |
| Test assertions       | 75                   | 94     | 71     | 49     | 73     |

**Twice the baseline's cost.** That is the number this configuration has to
justify, and one run cannot say whether it does.

`assumptions surfaced` is a real 4 rather than a dash for the first time in the
round — and it is the one measure the expert is supposed to move. It could only
be read because the run stopped to ask, which headlessness had made invisible in
every other configuration.

## Checks

```
PASS   check 0   src/ changed, so there is something to check
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test            (# pass 75  # fail 0)
PASS   check 1c  more assertions than the baseline's 6
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

Check 5: eight malformed bodies, both create routes, all 400, no 5xx.

**Check 3 — deleting a project that has tasks.** 409, as approved.

|                        |                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- |
| What its design says   | `delivery/assumptions.md`, as proposal A3, approved before the code was written |
| What the code does     | `projects.ts` answers 409 while any task remains                                |
| Is there a test for it | yes — "is 409 while the project has tasks, and keeps both"                      |

This is the only run of the five where the design was written down **before**
the implementation and can be compared against it rather than inferred from it.

## What the extra cost bought

```
delivery/brief.md  plan.yaml  assumptions.md  contracts/api.md  state.md  report.md
delivery/verify.sh + evidence/{T1,T2,T3,T4,final}/log.txt
```

`verify.sh` is its own: a nine-line script that runs each task's commands fresh
and writes the command, the exit code and the output under
`delivery/evidence/<id>/`. `evidence/final/log.txt` ends `overall exit 0`.

So the expert's "nothing counts as done until something other than the worker
has verified it" was applied to a run with no workers — the agent built a
verification trail against itself. Whether that is worth twice the price is the
question the second run exists to inform.

The code is also the most modular of the five: `projects.ts`, `tasks.ts`,
`store.ts`, `validate.ts`, `testing.ts`, and three test files rather than one.

## Notes

The reply was the only input after the first prompt. The run ended on its own.
