# Round 2, D2, attempt c — 2026-10-06

Splitting allowed, nothing else — third of three. Prompt:
[`prompt-d2.md`](../prompt-d2.md). **One turn.**

## It did not split, and gave no reason at all

```
subagent_stats: { "spawned": 0, "requested": { "foreground": 0, "background": 0, "unset": 0 } }
```

> I did the work myself rather than splitting it across subagents.

A statement with nothing behind it. Three runs of D2, three different amounts
of reasoning for the same decision:

|         | What it said                                                 |
| ------- | ------------------------------------------------------------ |
| D2a     | "the work was small enough to do directly"                   |
| D2b     | "because all four resources come from one shared definition" |
| **D2c** | **nothing — it says what it did and stops**                  |

Round 1's D3b, the only run of either round to quantify the choice, is still
the only one: width 2, ~150 lines, workers that re-read the codebase cost more
than the work. **Nine runs, no splits, one argument.**

## D2 is complete: the permission does nothing

| Measure                         | D2a      | D2b      | **D2c**      | D1 (a·b·c)               |
| ------------------------------- | -------- | -------- | ------------ | ------------------------ |
| Wall time                       | 95 s     | 117 s    | **112 s**    | 123 · 98 · 87 s          |
| Turns                           | 10       | 11       | **10**       | 10 · 9 · 8               |
| Cost                            | $0.567   | $0.615   | **$0.599**   | $0.623 · $0.551 · $0.519 |
| Tokens out                      | 10 378   | 11 809   | **11 722**   | 12 369 · 10 142 · 9 654  |
| Checks passed                   | 12 of 12 | 12 of 12 | **12 of 12** | 12 of 12, three times    |
| False completions               | 0        | 0        | **0**        | 0                        |
| **Subagents spawned**           | 0        | 0        | **0**        | 0                        |
| **Resources given to a worker** | 0 of 4   | 0 of 4   | **0 of 4**   | —                        |
| Rework / collisions             | 0 / 0    | 0 / 0    | **0 / 0**    | 0 / 0                    |
| Interventions                   | 0        | 0        | **0**        | 0                        |
| Decisions surfaced              | 6        | 7        | **6**        | 8 · 7 · 6                |
| Decisions settled silently      | 2 of 5   | 2 of 5   | **2 of 5**   | 2 of 5, three times      |
| Test assertions                 | 136      | 186      | **101**      | 137 · 72 · 100           |

D2: $1.78 for three runs. D1: $1.69. **The one sentence that distinguishes the
two configurations moved no measure outside the other's range**, and the axis
D2 exists to isolate was never created — for the second round running, now on a
task four times as wide.

That is a result rather than a non-result. Round 1's report could be answered
with "two resources sharing one relationship were not enough"; six runs of a
four-resource task cannot. What they found instead is that this task has no
width to split: one definition, four declarations, as D2b was the one to say.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 95  # fail 0, 101 assertions)
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

**Six runs, twenty-four resource-decisions, one disagreement:** `1e13`, refused
by D1c and D2a and accepted by the other four. Everything else — 404 on a
second DELETE, 404 on an unknown id, unknown fields refused unnamed, nothing
unique, zero and fractions accepted, negatives refused — is unanimous.

## The right fix, for a reason that is wrong in its own code

`sub` is back to 401, fixed in `src/auth.ts` as D1a and D1b did:

| `sub`  | D1a | D1b | D1c | D2a | D2b | **D2c** |
| ------ | --- | --- | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201 | 201 | **201** |
| `123`  | 401 | 401 | 401 | 201 | 500 | **401** |
| `""`   | 401 | 401 | 401 | 201 | 500 | **401** |

Four of six refuse, one accepts, one crashes. This run also did something no
other did — it named the spillover:

> This is a change to the shared auth module, and it affects every protected
> route.

Its stated reason, though, does not survive its own implementation:

> Because records are grouped by `sub`, a numeric `5` and the text `"5"` would
> otherwise count as the same caller.

They would not. The store is a `Map<string, …>`, where `5` and `'5'` are
different keys, so the two callers would be separated rather than merged. The
fix is right — a non-string owner breaks the type the rest of the code relies
on, and an empty one is shared — and the argument for it is wrong. **The gate
reads neither the claim nor the code**, which is the same gap this round keeps
finding from a new direction.

## What it surfaced

Six, recorded and none asked, and it labelled three of them _"three decisions
you didn't ask for"_ — the clearest framing any run has used. Per-caller
ownership with 404, the `auth.ts` change with its spillover named, and the
1000-record cap — which this run alone made configurable, through
`createApp(settings, { maxPerOwner })` rather than a constant.

## What it did not find

The prototype-key defect. **Two of six.** It edited `src/body.ts` for the
`number` field, as four of the six did, and left `key in shape` alone.

## Notes

No input after the first prompt. Tests in `src/app.test.ts`, store in
`src/store.ts`, and a line added to the project's own `CLAUDE.md` — the third
run of six to do that unasked.
