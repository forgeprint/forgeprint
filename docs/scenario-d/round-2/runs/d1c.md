# Round 2, D1, attempt c — 2026-10-06

The baseline configuration, third of three — the third run round 1 never had.
Prompt: [`prompt-d1.md`](../prompt-d1.md). **One turn.**

## The run

|                       |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| Configuration         | D1                                                               |
| Attempt               | c                                                                |
| Date                  | 2026-10-06                                                       |
| Agent, model, version | Claude Code 2.1.291, headless (`claude -p`), `--model opus`      |
| Starting project      | round 2's frozen baseline, unchanged                             |
| Prompt file           | [`prompt-d1.md`](../prompt-d1.md), read by [`run.sh`](../run.sh) |

Run one at a time, not in parallel: wall time is one of the measures, and two
headless sessions on one machine would make it mean something else. D1c started
when D1b's `.end` file appeared.

## Measures — and the configuration's three points

| Measure                     | D1a      | D1b      | D1c          |
| --------------------------- | -------- | -------- | ------------ |
| Wall time                   | 123 s    | 98 s     | **87 s**     |
| Turns                       | 10       | 9        | **8**        |
| Cost                        | $0.623   | $0.551   | **$0.519**   |
| Tokens out                  | 12 369   | 10 142   | **9 654**    |
| Checks passed               | 12 of 12 | 12 of 12 | **12 of 12** |
| False completions           | 0        | 0        | **0**        |
| Subagents spawned           | 0        | 0        | **0**        |
| Resources given to a worker | 0 of 4   | 0 of 4   | **0 of 4**   |
| Rework / collisions         | 0 / 0    | 0 / 0    | **0 / 0**    |
| Interventions               | 0        | 0        | **0**        |
| Decisions surfaced          | 8        | 7        | **6**        |
| Decisions settled silently  | 2 of 5   | 2 of 5   | **2 of 5**   |
| Test assertions             | 137      | 72       | **100**      |

**Assertion counts are noise, again.** 137, 72, 100 on one task in one
configuration. Round 1 said so across six runs (94, 71, 49, 73, 75, 68) and
this says it again inside a single configuration, which is the cleaner
demonstration. Nothing should be read into a count.

The falling cost, turns and wall time across a·b·c is three points in the order
they happened and not a trend: one task, one configuration, no manipulation
between them.

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 94  # fail 0, 100 assertions)
PASS  check 0b  19 routes declared, four per resource
PASS  check 5   16 malformed bodies, no 5xx
PASS  check 6   24 coerced values, all 400
PASS  check 7   four refusals, none echoing the probe
```

## Check 3 — and the one disagreement in the round so far

```
/projects  create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
budgets.limit  -1->400  1e13->400  0->201  1.5->201
```

Within the run, the four agree on everything: one function in `createApp`
registers all four, over a `Store` class in the new `src/store.ts`.

Across the three runs, the five open decisions agree on four of five — a second
DELETE is 404, an unknown id is 404, an unknown field is refused unnamed,
nothing is unique, fractions and zero are accepted — and differ on exactly one:

| `budgets.limit` upper bound | D1a | D1b | D1c     |
| --------------------------- | --- | --- | ------- |
| `1e13`                      | 201 | 201 | **400** |

D1c capped it at `1e12` and said so; D1a and D1b used `MAX_SAFE_INTEGER`. All
three named the bound as a decision the task did not make. **That is the whole
divergence in fifteen resource-decisions.** With one agent per run and one
function per run, agreement was never at risk — which is what makes it a
baseline rather than a result.

## What it surfaced

Six, recorded and not asked: in-memory storage — and it named `src/store.ts` as
_"the part to replace with real storage"_, which no other run did — per-caller
ownership answering 404 (citing OWASP API1 in the file), the 1000-record cap,
the length limits as explicit decisions, the `number` field added to the shared
validator, and the `1e12` bound.

**The non-string `sub`: three for three.** All three runs saw that `jose`
checks `sub` is present and not that it is usable. D1a and D1b fixed it in
`src/auth.ts`; D1c instead refuses at each route, reading the claim through a
`subject(c)` helper that answers 401 when it is not a non-empty string. Three
independent runs, one hazard, two answers — and the hazard follows from the
design all three chose rather than from any of them reading carefully.

## What it did not find

The prototype-key defect, again. **One of three.** D1c edited `src/body.ts` to
add the `number` field and left `key in shape` alone, as D1b did. The one run
that found it is why
[1.3.1](../../../../blueprints/ts-http-service/CHANGELOG.md) exists; the two
that did not are why it is a test in the blueprint rather than a note in a
review.

## Notes

No input after the first prompt. It also edited the project's own `CLAUDE.md`,
as D1a did and D1b did not.

**D1 is complete: three runs, 12 of 12 each, zero subagents, zero
interventions, $1.69 in all.** That is the floor. D2 is allowed to split and
D3 is told how; what either has to beat is not a score but this — four
resources, no collisions, nothing reworked, and a question handed back instead
of guessed.
