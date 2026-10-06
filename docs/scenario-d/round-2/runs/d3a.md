# Round 2, D3, attempt a — 2026-10-06

Splitting allowed, with the `technical-program-manager` expert installed in the
run directory and named in the prompt:
[`prompt-d3.md`](../prompt-d3.md). **Two turns**, under the
[answer policy](../reply.md) — which, unlike round 1, was committed before the
first run of the round.

## Turn 1: it refused to guess, and the gate caught that

No code. `delivery/brief.md`, `spec.md`, `plan.yaml`, `assumptions.md`,
`contracts/`, `state.md`, and later `evidence/T1` and `report.md`.

```
FAIL   check 0   nothing under src/ changed — the task was not implemented
FAIL   check 1c  14 assertions against the baseline's 14 — nothing was added
```

Round 1 reported **5 of 5** on exactly this situation, because every assertion
in the script asked whether something had got worse. `check 0` and `check 1c`
exist because of that, and here they are, failing before anybody read a record.

### The best split analysis of either round, and it is arithmetic

> **Splitting:** I'm doing this with one agent, not subagents. One shared piece
> has to come first: a common route builder plus storage, built and tested with
> `projects`. After that, the other three resources could run side by side
> (width 3). But each one is only a field list and its tests, so handing them
> out would cost more than writing them.

It names the dependency (one shared piece first), the width that is left
afterwards (3), and why that width is worthless (a field list each). Compare the
six runs without the expert:

|                 | What it said about splitting                                            |
| --------------- | ----------------------------------------------------------------------- |
| D1a · D1b · D1c | nothing; the prompt does not raise it                                   |
| D2a             | "the work was small enough to do directly"                              |
| D2b             | "because all four resources come from one shared definition"            |
| D2c             | nothing beyond the fact                                                 |
| **D3a**         | **the dependency, the remaining width, and the cost of handing it out** |

**Two runs across two rounds have quantified this decision, and both had the
expert** — round 1's D3b and this one. Six runs without it produced one
structural sentence and four bare assertions. That is the clearest thing either
round has said in favour of the principles, and it is about **how a decision is
made**, not about what was decided: nine runs, no splits.

### Three decisions it would not guess

> The rules you asked me to follow say a guess that would force a redo if wrong
> must be approved before any code is built on it.

- **A1 Storage** — in memory, lost on restart.
- **A2 Ownership** — each record belongs to the token's `sub`; somebody else's
  record answers 404, like one that does not exist.
- **A3 `limit`** — a real finite number, 0 or more; `"5"` and `null` refused.

And four it would not stop for: no update route, delete answers 204, the text
length limits, `/items` untouched. Separating the two is the expert's rule, and
no other run of the round made that distinction at all.

## Turn 2: approved, then implemented

The policy's reply, verbatim and nothing else:

```
Approved — proceed with all four proposals as written. Add nothing.
```

It made three proposals and the sentence says four, which
[`reply.md`](../reply.md) decided in advance: the count is history, and
rewording per run would make the reply a variable.

## Measures

| Measure                     | D3a                             | D1 (a·b·c)               | D2 (a·b·c)               |
| --------------------------- | ------------------------------- | ------------------------ | ------------------------ |
| Wall time                   | **216 s** (53 + 129, two turns) | 123 · 98 · 87 s          | 95 · 117 · 112 s         |
| Turns                       | **16** (8 + 8)                  | 10 · 9 · 8               | 10 · 11 · 10             |
| Cost                        | **$1.485** ($0.426 + $1.059)    | $0.623 · $0.551 · $0.519 | $0.567 · $0.615 · $0.599 |
| Tokens out                  | **18 377**                      | 12 369 · 10 142 · 9 654  | 10 378 · 11 809 · 11 722 |
| Checks passed               | **12 of 12**                    | 12 of 12 ×3              | 12 of 12 ×3              |
| False completions           | **0**                           | 0                        | 0                        |
| **Subagents spawned**       | **0**                           | 0                        | 0                        |
| Resources given to a worker | **0 of 4**                      | —                        | 0 of 4                   |
| Rework / collisions         | **0 / 0**                       | 0 / 0                    | 0 / 0                    |
| Interventions               | **1, by policy**                | 0                        | 0                        |
| Decisions surfaced          | **7, three of them asked**      | 8 · 7 · 6                | 6 · 7 · 6                |
| Decisions settled silently  | **2 of 5**                      | 2 of 5 ×3                | 2 of 5 ×3                |
| Test assertions             | **169**                         | 137 · 72 · 100           | 136 · 186 · 101          |

**$1.485 against a mean of $0.579 across the six runs without the expert:
2.6×.** Round 1 measured roughly 2× on a narrower task and said the expert
"changed behaviour in the direction it claims and cost roughly twice as much to
do it". The number holds at four resources.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 143  # fail 0, 169 assertions)
PASS  check 0b  19 routes declared, four per resource
PASS  check 5 · 6 · 7                            no 5xx, every coercion 400, nothing echoed
```

## Check 3 — measured

```
/projects  create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
budgets.limit  -1->400  1e13->201  0->201  1.5->201
```

Seven runs, twenty-eight resource-decisions, still one disagreement: `1e13`.

## It built what a split plan would look like, with one agent

First run of the round to write **one test file per resource** —
`projects.test.ts`, `notes.test.ts`, `tags.test.ts`, `budgets.test.ts` — over a
shared `src/testing.ts` helper, with `resource.ts` holding the builder and
`resources.ts` the four definitions. That is exactly the shape its plan
described for width 3, produced without a worker: the parts are separable, so it
separated the files and did them itself.

For the round's question this cuts both ways. It is evidence that the work
**can** be partitioned, which the six earlier runs' single test files obscured —
and evidence that partitioning it is cheap enough not to need an agent each.

## And the hazard it named is the one it left open

A2 — ownership by `sub` — was one of the three decisions it stopped the run to
have approved. Then:

```ts
// auth.ts requires `sub`, so the owner is always present.
const owner = (sub: string | undefined): string => sub ?? '';
```

The comment is right that the claim is present and wrong that it is usable.
`?? ''` files every token whose `sub` is not a non-empty string under one
shared owner — the exact failure D2b's comment described and refused. Measured:

| `sub`  | D1a | D1b | D1c | D2a | D2b | D2c | **D3a** |
| ------ | --- | --- | --- | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201 | 201 | 201 | **201** |
| `123`  | 401 | 401 | 401 | 201 | 500 | 401 | **201** |
| `""`   | 401 | 401 | 401 | 201 | 500 | 401 | **201** |

**The run that was most careful about naming the decision implemented it least
safely**, and all seven runs pass twelve of twelve. Whatever the expert moves,
it is not this.

## What it did not find

The prototype-key defect. **Two of seven.**

## Notes

One reply, the policy's, sent on a mechanical condition and recorded as an
intervention. `delivery/evidence/T1` holds the run's own verification output,
which is the expert's "nothing counts as done until something other than the
worker has verified it" applied by the same agent to itself — no subagent
reviewer this time, unlike round 1's D3b.
