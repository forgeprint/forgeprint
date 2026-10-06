# Round 2, D2, attempt a — 2026-10-06

Splitting allowed, nothing else. Prompt: [`prompt-d2.md`](../prompt-d2.md) —
D1's prompt plus one sentence: _"You may split the work across subagents."_
**One turn.**

## It did not split, and said so in one line

```
subagent_stats: { "spawned": 0, "requested": { "foreground": 0, "background": 0, "unset": 0 } }
```

> I didn't use subagents; the work was small enough to do directly.

**That is the seventh run across both rounds that has not split**, and the
first on a task of four independent resources — the change round 1's report
asked for, on the grounds that two resources sharing one relationship were not
wide enough for splitting to be the cheaper option.

It is worth putting beside round 1's D3b, which declined with an argument:

> Single agent, no subagents: width is 2 after T1, the parallel part is ~150
> lines, and spawning workers that each re-read the codebase costs more than
> the work.

D2a's reason is an assertion where D3b's was arithmetic. Neither split; only
one of them knows why. Whether the principles are what produce the arithmetic
is D3's question, and it is still open.

## Measures

| Measure                     | D2a          | D1a      | D1b      | D1c      |
| --------------------------- | ------------ | -------- | -------- | -------- |
| Wall time                   | **95 s**     | 123 s    | 98 s     | 87 s     |
| Turns                       | 10           | 10       | 9        | 8        |
| Cost                        | **$0.567**   | $0.623   | $0.551   | $0.519   |
| Tokens out                  | 10 378       | 12 369   | 10 142   | 9 654    |
| Checks passed               | **12 of 12** | 12 of 12 | 12 of 12 | 12 of 12 |
| False completions           | 0            | 0        | 0        | 0        |
| **Subagents spawned**       | **0**        | 0        | 0        | 0        |
| Resources given to a worker | **0 of 4**   | —        | —        | —        |
| Rework / collisions         | 0 / 0        | 0 / 0    | 0 / 0    | 0 / 0    |
| Interventions               | 0            | 0        | 0        | 0        |
| Decisions surfaced          | 6            | 8        | 7        | 6        |
| Decisions settled silently  | 2 of 5       | 2 of 5   | 2 of 5   | 2 of 5   |
| Test assertions             | 136          | 137      | 72       | 100      |

**The permission cost nothing and bought nothing.** $0.567 sits inside D1's
$0.519–$0.623, 95 s inside D1's 87–123 s, and the one sentence that
distinguishes the configurations changed no measure. Round 1 said this about a
narrow task and could be answered with "the task was too small". It cannot be
answered that way here.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 122  # fail 0, 136 assertions)
PASS  check 0b  19 routes declared, four per resource
PASS  check 5 · 6 · 7                            no 5xx, every coercion 400, nothing echoed
```

## Check 3 — measured

```
/projects  create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
budgets.limit  -1->400  1e13->400  0->201  1.5->201
```

Identical to D1c, including the `1e12` cap, and identical to D1a and D1b
everywhere except that bound. One `resource<In, T>()` function in `app.ts`
serves all four over a `Store` class in `src/store.ts`, so the four cannot
disagree — the fourth run in a row to factor it that way.

## The first run to leave the `sub` hazard open

The three D1 runs all noticed that `jose` checks `sub` is present and not that
it is usable. This one wrote a helper with a comment that says it checks:

```ts
// The middleware requires `sub`, but the claims type cannot know that, so
// this checks rather than casts.
const owner = (c: Context<Env>): string | undefined => c.get('claims').sub;
```

It checks for `undefined` and nothing else, because the type says `string |
undefined` and the runtime does not. Measured, with a token minted for each
case:

| `sub`  | D1a | D1b | D1c | **D2a** |
| ------ | --- | --- | --- | ------- |
| `"u1"` | 201 | 201 | 201 | 201     |
| `123`  | 401 | 401 | 401 | **201** |
| `""`   | 401 | 401 | 401 | **201** |

An empty owner is accepted, so every caller whose token carries one shares a
single bucket of records. **No acceptance check asks about this**, and all
twelve pass. It is the clearest thing the round has produced about what the
gate cannot see — and a comment that claims a check it does not perform is
worse than no comment, because the next reader stops looking.

## What it surfaced

Six, all recorded and none asked: in-memory storage, per-caller ownership
answering 404 — and it said it added that _"without being asked"_ — the
1000-record cap at 409, the `number` field added to the shared validator with
`1e400` refused as infinity, the `1e12` bound, and the text length limits
handed back as _"change these if you need different values"_.

Silent, as in every run so far: what a second DELETE answers, and whether
anything is unique.

## What it did not find

The prototype-key defect. **One of four.** It edited `src/body.ts` for the
`number` field, as D1b and D1c did, and left `key in shape` alone.

## Notes

No input after the first prompt. Tests in a new `src/resources.test.ts`; the
project's own `CLAUDE.md` untouched.
