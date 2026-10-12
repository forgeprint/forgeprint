# Round 2, D3, attempt b — 2026-10-12

Splitting allowed, with the `technical-program-manager` expert installed in the
run directory and named in the prompt:
[`prompt-d3.md`](../prompt-d3.md). **Two turns**, under the
[answer policy](../reply.md).

**The first run of either round to split the work.** Eight runs had not, and
round 1's report said the axis could not be measured until one did. This is
that run, and what it measured is not what the question assumed.

## Turn 1: the same refusal as D3a, and the gate caught it the same way

No code. `delivery/brief.md`, `spec.md`, `plan.yaml`, `assumptions.md`,
`contracts/`, `state.md`, and later `evidence/` and `report.md`.

```
FAIL   check 0   nothing under src/ changed — the task was not implemented
FAIL   check 1c  14 assertions against the baseline's 14 — nothing was added
```

Eight decisions, A1–A8, three of them marked critical and held for approval:
storage in memory, ownership by the token's `sub` with 404 for somebody else's
record, and a `number` kind added to the shared `body.ts`. The other five went
ahead as defaults. **A8 is the one no earlier run wrote down**: it is the split
itself, named as a decision with a width.

## Turn 2: three workers, and the collision designed out before it could happen

The policy's reply, verbatim. Then the plan was carried out — and changed on
one point, which `assumptions.md` records in its own line:

> Change after approval (no new decision, only file ownership): to keep paths
> disjoint and `app.ts` single-owner, T1 writes all four resource definition
> files; workers T2–T4 write only their test files against the frozen
> contracts. A worker that finds a definition defect reports it; it does not
> edit it.

Round 2 exists to create two shared surfaces — `src/app.ts`, where every
resource must register, and `src/body.ts`, where `limit` forces a numeric type
— and to see what two workers do when they meet there. **This run answered by
never sending two workers to either file.** The coordinator built both shared
pieces, all four resource definitions and `projects` end to end first; the
three workers were given one test file each.

So the measured collision count is 0, and it is 0 by construction rather than
by luck. That is a result about the principles, not a missing measurement: the
expert's instruction to keep task paths disjoint is exactly what removes the
hazard the round was built to observe.

### What the workers were worth

| Task | Owner          | Scope                                                                | Attempts | Status   |
| ---- | -------------- | -------------------------------------------------------------------- | -------- | -------- |
| T1   | coordinator    | both shared files, four definitions, `projects` + tests, route table | 1 of 2   | verified |
| T2   | worker-notes   | `src/notes.test.ts` (44 tests)                                       | 1 of 2   | verified |
| T3   | worker-tags    | `src/tags.test.ts` (32 tests)                                        | 1 of 2   | verified |
| T4   | worker-budgets | `src/budgets.test.ts` (37 tests)                                     | 1 of 2   | verified |
| T5   | coordinator    | fresh full run, mutation check, report                               | 1 of 2   | verified |

Three subagents, all `general-purpose`, maximum depth 1, none failed, none
refused, nothing discarded. Every worker's verify command was rerun by the coordinator rather
than believed, and the 16 files written before the fan-out were hashed and
re-checked afterwards (`evidence/T1/pre-fanout.sha`): unchanged, and the only
new files were the three test files.

### The one thing the workers produced that nobody asked for

> All three workers reported that the check command I gave them failed.
> Compiled output in a temporary directory could not resolve `jose`. Each
> worker worked around it with a `node_modules` symlink outside the repo. The
> coordinator removed those symlinks afterwards.

A coordinator-written verify command that did not work, three workers
independently inventing the same workaround outside the project, and a cleanup
pass afterwards. No rework in the sense of discarded output — and the first
coordination cost either round has recorded at all.

## It mutation-tested its own tests

T5 injected eight defects into a scratch copy and ran the test files against
each: coerced numbers, an ignored maximum, owner-blind `get`, `list` and
`delete`, a flipped default, a loosened length, a required field made
optional. All eight were caught. It also threw out its own first attempt at M1
as an equivalent mutant, because `Number.isFinite("5")` is already false.

No run of either round has done this. It is the expert's "nothing is done until
something other than the worker verified it" turned on the verification itself,
and it is the only evidence in nine runs that a run's tests would catch a
regression rather than merely pass today.

## Measures

| Measure                     | D3b                                        | D3a            | D1 (a·b·c)               | D2 (a·b·c)               |
| --------------------------- | ------------------------------------------ | -------------- | ------------------------ | ------------------------ |
| Wall time                   | **284 s** (63 + 221, two turns)            | 216 s          | 123 · 98 · 87 s          | 95 · 117 · 112 s         |
| Turns                       | **14** (8 + 6)                             | 16             | 10 · 9 · 8               | 10 · 11 · 10             |
| Cost                        | **$3.216** ($0.463 + $2.753)               | $1.485         | $0.623 · $0.551 · $0.519 | $0.567 · $0.615 · $0.599 |
| Tokens out                  | **11 640** (coordinator only)              | 18 377         | 12 369 · 10 142 · 9 654  | 10 378 · 11 809 · 11 722 |
| Checks passed               | **12 of 12**                               | 12 of 12       | 12 of 12 ×3              | 12 of 12 ×3              |
| False completions           | **0**                                      | 0              | 0                        | 0                        |
| **Subagents spawned**       | **3** — all workers, test files            | 0              | 0                        | 0                        |
| Resources given to a worker | **3 of 4, tests only; 0 of 4 implemented** | 0 of 4         | —                        | 0 of 4                   |
| Rework / collisions         | **0 / 0** (paths disjoint by design)       | 0 / 0          | 0 / 0                    | 0 / 0                    |
| Interventions               | **1, by policy**                           | 1, by policy   | 0                        | 0                        |
| Decisions surfaced          | **8, three of them asked**                 | 7, three asked | 8 · 7 · 6                | 6 · 7 · 6                |
| Decisions settled silently  | **2 of 5**                                 | 2 of 5         | 2 of 5 ×3                | 2 of 5 ×3                |
| Test assertions             | **178** (152 tests)                        | 169            | 137 · 72 · 100           | 136 · 186 · 101          |

**$3.216 against $0.579 mean across the six runs without the expert: 5.6×, and
2.2× against D3a, which had the same expert and did not split.** The output
token count is the coordinator's alone; the three workers are in the money and
not in that column, which is why the cheaper-looking number is the larger bill.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 152  # fail 0, 178 assertions)
PASS  check 0b  19 routes declared, four per resource
PASS  check 5 · 6 · 7                            no 5xx, every coercion 400, nothing echoed
```

## Check 3 — measured

```
/projects  create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
budgets.limit  -1->400  1e13->400  0->201  1.5->201
```

Four resources, five open decisions, no disagreement — which is the measure
the round cared most about, since twelve scripted checks pass on four
resources that contradict each other. **The run that split the work is also the
only one whose four resources were written against a frozen written contract**,
and the workers wrote tests against that contract rather than against each
other's code.

`1e13 -> 400` is new: A4 bounded `limit` at 1e12 and the code enforces it.
D3a accepted the same value. Eight runs, thirty-two resource-decisions, and
`1e13` is still the only answer any two runs disagree about.

## The `sub` hazard, and why this run is not D3a

```ts
const owner = (c: Context<Env>): string => c.get('claims').sub as string;
```

A cast, not a check — the same shape as D3a's `?? ''`, and the same table:

| `sub`  | D1a | D1b | D1c | D2a | D2b | D2c | D3a | **D3b** |
| ------ | --- | --- | --- | --- | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201 | 201 | 201 | 201 | **201** |
| `123`  | 401 | 401 | 401 | 201 | 500 | 401 | 201 | **201** |
| `""`   | 401 | 401 | 401 | 201 | 500 | 401 | 201 | **201** |

The behaviour behind the identical row is not identical. Measured directly:

```
no sub at all          -> 401     (auth.ts: requiredClaims ['exp','sub'])
sub="123" sees sub=123 -> false
u2 sees u1 records     -> false
```

D3a's `?? ''` filed every unusable `sub` under one shared owner. Here the claim
is required at the door and the value is used as the key as it arrives, so a
non-string `sub` gets its own bucket rather than everybody's. The cast is still
a lie to the type checker and the 201 is still a decision nobody asked for —
but the isolation A2 promised holds, and the run proved it on itself as M3, M7
and M8 of the mutation set.

**Eight runs, three distinct patterns** on a question the task never asks —
refuse, accept, or answer 500 — and all eight pass twelve of twelve.

## What it did not find

The prototype-key defect. `src/body.ts` still tests membership with
`key in shape` and `key in body`, so an unknown field is refused — `zzzextra`
answers 400 — while `constructor` is accepted as though it were declared:

```
{ name: 'a', zzzextra: 1 }    -> 400
{ name: 'a', constructor: 1 } -> 201
```

**Two of eight.** The run that wrote a mutation suite for its own tests
inherited the defect in the file it deliberately extended, because its
mutations tested the behaviour it wrote and not the line it was written next
to. The catalog's fix shipped as `ts-http-service` 1.3.1 on 2026-10-09, after
this baseline was taken.

## Notes

One reply, the policy's, sent on the mechanical condition and recorded as an
intervention. `CLAUDE.md` in the run directory differs from the baseline
because the driver renders the expert into it (`forgeprint get --agent
claude-code`), not because the run edited it.

`delivery/verify.sh` is the run's own re-runnable gate, which no earlier run
wrote. The three workers ran in the background at depth 1; none spawned a
subagent of its own.
