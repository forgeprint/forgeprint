# Round 2, D2, attempt b — 2026-10-06

Splitting allowed, nothing else. Prompt: [`prompt-d2.md`](../prompt-d2.md).
**One turn.**

## It did not split, and this time the reason is structural

```
subagent_stats: { "spawned": 0, "requested": { "foreground": 0, "background": 0, "unset": 0 } }
```

> I did the work myself rather than using subagents, because all four resources
> come from one shared definition.

**The eighth run across both rounds with no split**, and the sharpest answer yet
to round 1's first recommendation. That recommendation assumed four independent
resources would make splitting the cheaper option. Every run of this task has
found instead that four resources **factor into one definition plus four
declarations** — so the width the task appears to have is not width in the work.
D2a said "small enough"; this says why, and the two together are a better
answer than either.

## Measures

| Measure                     | D2a      | **D2b**      | D1a      | D1b      | D1c      |
| --------------------------- | -------- | ------------ | -------- | -------- | -------- |
| Wall time                   | 95 s     | **117 s**    | 123 s    | 98 s     | 87 s     |
| Turns                       | 10       | **11**       | 10       | 9        | 8        |
| Cost                        | $0.567   | **$0.615**   | $0.623   | $0.551   | $0.519   |
| Tokens out                  | 10 378   | **11 809**   | 12 369   | 10 142   | 9 654    |
| Checks passed               | 12 of 12 | **12 of 12** | 12 of 12 | 12 of 12 | 12 of 12 |
| False completions           | 0        | **0**        | 0        | 0        | 0        |
| Subagents spawned           | 0        | **0**        | 0        | 0        | 0        |
| Resources given to a worker | 0 of 4   | **0 of 4**   | —        | —        | —        |
| Rework / collisions         | 0 / 0    | **0 / 0**    | 0 / 0    | 0 / 0    | 0 / 0    |
| Interventions               | 0        | **0**        | 0        | 0        | 0        |
| Decisions surfaced          | 6        | **7**        | 8        | 7        | 6        |
| Decisions settled silently  | 2 of 5   | **2 of 5**   | 2 of 5   | 2 of 5   | 2 of 5   |
| Test assertions             | 136      | **186**      | 137      | 72       | 100      |

Five runs now sit between 87 s and 123 s and between $0.519 and $0.623, across
two configurations. The sentence allowing subagents has moved nothing.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 158  # fail 0, 186 assertions)
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

Five runs, twenty resource-decisions, one disagreement: `1e13`, which D1c and
D2a refuse and the other three accept.

## It found the prototype-key defect, and checked its own fix

> **I fixed an existing bug in `body.ts`.** The unknown-field check let
> `toString`, `constructor` and `__proto__` through, which would now have been
> stored. It now checks only the field names each route defines. I confirmed
> the new tests fail with the old check.

**Two of five.** D1a found it and fixed it; D1b, D1c and D2a each edited the
same file for the `number` field and left the membership test alone. This run
also did what [1.3.1](../../../../blueprints/ts-http-service/CHANGELOG.md) did
by hand: put the old operator back and watched the new test fail. The second
time a run has mutation-tested itself unasked, after
[D1b](d1b.md) — and nothing in the gate asks for it.

Its sentence also names what the defect costs here, which D1a did not: "which
would now have been stored". The task's four resources spread the validated
body into a record, so this run read the consequence rather than the operator.

## The same question, five answers, twelve checks green

The task never says what a token whose `sub` is not a usable string should do.
Measured, with a token minted per case:

| `sub`  | D1a | D1b | D1c | D2a | **D2b** |
| ------ | --- | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201 | **201** |
| `123`  | 401 | 401 | 401 | 201 | **500** |
| `""`   | 401 | 401 | 401 | 201 | **500** |

D2b's check is the most careful of the five, and its comment reasons about
exactly the right hazard — "a record filed under `undefined` would be shared by
every caller whose token lacked one, the day that option is removed". Then it
signals with an exception:

```ts
function owner(c: Context<Env>): string {
  const sub = c.get('claims').sub;
  if (typeof sub !== 'string' || sub === '') throw new Error('a verified token had no sub');
  return sub;
}
```

Hono turns that into a 500. So on one question the task leaves open, five runs
produced a refusal, an acceptance and a crash — and **all five pass twelve of
twelve**. Check 5 asks whether a malformed _body_ answers 4xx rather than 5xx;
nothing asks it about a malformed _claim_.

**That check is not being added now.** The gate was written before the first
run and adding to it mid-round is how a gate comes to describe the runs it has
seen. It belongs in the round's report as a proposal for the next one, with
this table as its evidence.

## What it surfaced

Seven, recorded and none asked. The five every run surfaces, plus:

- **the prototype-key fix**, with its mutation check;
- **a gap it chose not to close**: no cap on records and no rate limiting, "so
  an authenticated caller can grow the heap". Every other run invented a
  1000-record cap and a 409. This one named the absence instead of inventing a
  limit nobody asked for, which is a defensible second answer and the only run
  to give it.

## Notes

No input after the first prompt. `src/resources.ts` holds the definition,
`src/app.ts` the four declarations, tests in `src/resources.test.ts` — the same
shape as every other run of this task, reached again independently.
