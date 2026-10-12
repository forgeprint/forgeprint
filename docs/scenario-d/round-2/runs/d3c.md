# Round 2, D3, attempt c — 2026-10-12

Splitting allowed, with the `technical-program-manager` expert installed in the
run directory and named in the prompt:
[`prompt-d3.md`](../prompt-d3.md). **Two turns**, under the
[answer policy](../reply.md).

The second run to split, and the first to hand a worker something other than a
test file. It is also **the only run of either round that failed a check** —
and the check is wrong.

## Turn 1: the third identical refusal

No code. `delivery/brief.md`, `plan.yaml`, `assumptions.md`, and later
`evidence/` and `report.md`. The gate said what it said for D3a and D3b:

```
FAIL   check 0   nothing under src/ changed — the task was not implemented
FAIL   check 1c  14 assertions against the baseline's 14 — nothing was added
```

Seven decisions, A1–A7, three held for approval: storage, ownership by `sub`
with 404 for another caller's record, and `limit` as a finite number ≥ 0.
**A3 adds a clause no other run wrote down** — "no upper bound beyond JSON" —
which turns out to matter below.

The split was named in the first turn, with the concurrency limit as its
reason:

> At most 3 tasks can run at once, so I'll use one coordinator and three
> workers. … T2–T4: three workers build `notes`, `tags` and `budgets` at the
> same time. Each one writes only its own two files.

## Turn 2: the workers owned implementations, and `app.ts` still had one owner

| Task | Owner          | Scope                                                                | Attempts |
| ---- | -------------- | -------------------------------------------------------------------- | -------- |
| T0   | coordinator    | `number` kind in `body.ts`, store, contract, test kit, **test glob** | 1 of 2   |
| T1   | coordinator    | `projects` end to end as the reference                               | 1 of 2   |
| T2   | worker-notes   | `src/resources/notes.ts` **and** `notes.test.ts`                     | 1 of 2   |
| T3   | worker-tags    | `src/resources/tags.ts` **and** `tags.test.ts`                       | 1 of 2   |
| T4   | worker-budgets | `src/resources/budgets.ts` **and** `budgets.test.ts`                 | 1 of 2   |
| T5   | coordinator    | mount all four in `app.ts`, app-level tests, README                  | 1 of 2   |

**Three of the four resources were actually built by a worker** — the measure
round 2 was built to move, and the first non-zero reading of it that is not
"tests only". D3b gave its workers one test file each and kept every
implementation; this run gave away the implementations and kept only the two
shared surfaces: `body.ts` in T0, `app.ts` in T5, each with exactly one owner
for the whole run.

So the second splitting run avoided the collision the same way the first did,
by a different route. Two runs, two shapes of the split, zero collisions, and
in both cases because the shared file was assigned to one task before any
worker started. That is now a pattern rather than an anecdote.

Nothing was rejected, nothing blocked, no contract change, and every task was
re-verified by the coordinator with its own `delivery/verify.sh` (clean
`dist/`, build, full test run) rather than from a worker's report.

### It tested the gate's own question

```
mounting `projects` outside `protectedRoutes` makes the suite fail
("POST /projects answered without a token"); reverted and re-verified
```

One injected defect, aimed exactly at check 2. D3b ran eight mutations across
the resource behaviour; this run ran one, at the authorisation boundary. Two
runs of nine have asked whether their tests would fail if the code were wrong,
and both had the expert.

## Measures

| Measure                     | D3c                                     | D3b                | D3a            | D1 (a·b·c)               | D2 (a·b·c)               |
| --------------------------- | --------------------------------------- | ------------------ | -------------- | ------------------------ | ------------------------ |
| Wall time                   | **304 s** (76 + 228, two turns)         | 284 s              | 216 s          | 123 · 98 · 87 s          | 95 · 117 · 112 s         |
| Turns                       | **15** (9 + 6)                          | 14                 | 16             | 10 · 9 · 8               | 10 · 11 · 10             |
| Cost                        | **$3.058** ($0.463 + $2.595)            | $3.216             | $1.485         | $0.623 · $0.551 · $0.519 | $0.567 · $0.615 · $0.599 |
| Tokens out                  | **11 118** (coordinator only)           | 11 640             | 18 377         | 12 369 · 10 142 · 9 654  | 10 378 · 11 809 · 11 722 |
| Checks passed               | **11 of 12** — see below                | 12 of 12           | 12 of 12       | 12 of 12 ×3              | 12 of 12 ×3              |
| False completions           | **0**                                   | 0                  | 0              | 0                        | 0                        |
| **Subagents spawned**       | **3** — workers, implementation + tests | 3, tests only      | 0              | 0                        | 0                        |
| Resources given to a worker | **3 of 4**                              | 3 of 4, tests only | 0 of 4         | —                        | 0 of 4                   |
| Rework / collisions         | **0 / 0** (one owner per shared file)   | 0 / 0              | 0 / 0          | 0 / 0                    | 0 / 0                    |
| Interventions               | **1, by policy**                        | 1, by policy       | 1, by policy   | 0                        | 0                        |
| Decisions surfaced          | **7, three of them asked**              | 8, three asked     | 7, three asked | 8 · 7 · 6                | 6 · 7 · 6                |
| Decisions settled silently  | **2 of 5**                              | 2 of 5             | 2 of 5         | 2 of 5 ×3                | 2 of 5 ×3                |
| Test assertions             | **160** (133 tests)                     | 178 (152)          | 169            | 137 · 72 · 100           | 136 · 186 · 101          |

**$3.058, against $0.579 mean across the six runs without the expert: 5.3×.**
The two splitting runs cost $3.22 and $3.06; the expert run that declined to
split cost $1.49. Splitting roughly doubled the bill of a configuration that
already cost 2.6× the baseline, and the output-token column does not show it
because the workers' tokens are in the money, not in the coordinator's count.

## Checks

```
PASS   check 0 · 1a · 1c · 2 · 4a · 4b          (# pass 133  # fail 0, 160 assertions)
FAIL   check 1b  4 test file(s) below src/ are never run by dist/*.test.js
PASS  check 0b  19 routes declared, four per resource
PASS  check 5 · 6 · 7                            no 5xx, every coercion 400, nothing echoed
```

### The one red check of the round is a false positive

`check 1b` is a filesystem test: any `*.test.ts` at depth 2 or more under
`src/` fails it. It was written because the blueprint's test script is
`node --test dist/*.test.js`, which does not glob into subdirectories, so a
test file one level down never runs and therefore never fails.

This run put its four resource test files in `src/resources/` **and widened the
script in the same task**, which `report.md` records as a scope change to T0
made before the work:

```json
"test": "node --test dist/*.test.js dist/resources/*.test.js"
```

Measured rather than argued:

```
npm test            # tests 133  # pass 133  # fail 0
  ok 2 - budgets    ok 3 - notes   ok 4 - projects   ok 5 - tags
per file:  projects 27  notes 32  tags 26  budgets 32   (117 of the 133)
```

The four files run, inside the one command the gate uses. The condition check
1b exists to detect — a test that cannot fail — is absent, so the record is
**11 of 12 with the twelfth a false positive**, and the check is not amended
mid-round. Round 1 changed the gate between rounds and said so; this is the
next such note, and it belongs to the report rather than to this run.

What the finding is worth keeping for: a check written against one command's
glob measures the glob, not the property. The property is "every test file is
reached by `npm test`", and nine runs in, the cheap filesystem proxy for it has
produced one false positive and no true ones.

## Check 3 — measured

```
/projects  create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  unknown-field 400  duplicate 201/201
budgets.limit  -1->400  1e13->201  0->201  1.5->201
```

Four resources, five open decisions, no disagreement — **and three of the four
were written by different workers**, against the contract T0 froze. Round 2's
central worry was four resources that contradict each other while twelve checks
pass; the two runs that actually partitioned the work are the two with the
strongest reason not to contradict themselves, because the contract existed
before the parallel part did.

`1e13 -> 201`, where D3b answered 400. Nine runs, thirty-six
resource-decisions, and `1e13` remains the only answer any two runs disagree
about — but this is the first run to **decide** it: A3 says "no upper bound
beyond JSON" in writing. The disagreement is now between two stated positions
rather than between a position and an accident.

## The `sub` hazard

```ts
const owner = (c: Context<Env>): string => c.get('claims').sub as string;
```

The same cast as D3b, and the same measured behaviour:

| `sub`  | D1a | D1b | D1c | D2a | D2b | D2c | D3a | D3b | **D3c** |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201 | 201 | 201 | 201 | 201 | **201** |
| `123`  | 401 | 401 | 401 | 201 | 500 | 401 | 201 | 201 | **201** |
| `""`   | 401 | 401 | 401 | 201 | 500 | 401 | 201 | 201 | **201** |

```
no sub at all          -> 401
sub="123" sees sub=123 -> false
u2 sees u1 records     -> false
```

Required at the door, used as the key as it arrives: isolation holds, the cast
is still unchecked. Nine runs, and the table has **three distinct patterns**:
refuse a non-string `sub` (D1 ×3, D2c), accept it (D2a, D3a, D3b, D3c), or
answer 500 (D2b). Every one of them passes the gate.

## What it did not find

The prototype-key defect:

```
{ name: 'a', zzzextra: 1 }    -> 400
{ name: 'a', constructor: 1 } -> 201
```

**Two of nine.** Both splitting runs extended `body.ts` deliberately — one
adding a `number` kind with bounds, the other without — and neither looked at
the two membership tests three lines above the code they added.

## Notes

One reply, the policy's, on the mechanical condition. The run said plainly what
it had not done: no unit tests for the store or the `number` kind on their own,
no update route, and that it skipped showing `projects` before the fan-out
because the approval said to go ahead. `CLAUDE.md` differs from the baseline
because the driver renders the expert into it; the run noticed the file was
already modified and left it alone, which is the correct call and the first
time any run mentioned it.
