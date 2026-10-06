# Round 2, D1, attempt b — 2026-10-06

The baseline configuration, second of three. Prompt:
[`prompt-d1.md`](../prompt-d1.md). **One turn** — the
[answer policy](../reply.md) did not fire.

## The run

|                       |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| Configuration         | D1                                                               |
| Attempt               | b                                                                |
| Date                  | 2026-10-06                                                       |
| Agent, model, version | Claude Code 2.1.291, headless (`claude -p`), `--model opus`      |
| Starting project      | round 2's frozen baseline, unchanged from [D1a](d1a.md)          |
| Prompt file           | [`prompt-d1.md`](../prompt-d1.md), read by [`run.sh`](../run.sh) |

## Measures

| Measure                     | D1b          | D1a      |
| --------------------------- | ------------ | -------- |
| Wall time                   | **98 s**     | 123 s    |
| Turns                       | 9            | 10       |
| Cost                        | **$0.551**   | $0.623   |
| Tokens out                  | 10 142       | 12 369   |
| Checks passed               | **12 of 12** | 12 of 12 |
| False completions           | 0            | 0        |
| Subagents spawned           | 0            | 0        |
| Resources given to a worker | 0 of 4       | 0 of 4   |
| Rework / collisions         | 0 / 0        | 0 / 0    |
| Interventions               | 0            | 0        |
| Decisions surfaced          | 7            | 8        |
| Decisions settled silently  | 2 of 5       | 2 of 5   |
| Test assertions             | 72           | 137      |

## Checks

```
PASS   check 0 · 1a · 1b · 1c · 2 · 4a · 4b      (# pass 65  # fail 0, 72 assertions)
PASS  check 0b  19 routes declared, four per resource
PASS  check 5   16 malformed bodies, no 5xx
PASS  check 6   24 coerced values, all 400
PASS  check 7   four refusals, none echoing the probe
```

## Check 3 — the four resources agree

Measured rather than read: create, delete, delete again, an unknown id, and the
same body twice, on each of the four.

```
/projects  create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/notes     create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/tags      create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
/budgets   create 201  delete 204  again 404  unknown-id 404  duplicate 201/201
budgets.limit  -1->400  1e13->201  0->201  1.5->201
```

One function in the new `src/resources.ts` (74 lines) serves all four, so they
cannot disagree — the same reason as D1a, reached independently.

| Decision                     | All four                                    | Named?             | Test? |
| ---------------------------- | ------------------------------------------- | ------------------ | ----- |
| a second DELETE              | 404                                         | no                 | yes   |
| an id that never existed     | 404, and a stranger's id answers the same   | yes                | yes   |
| an unknown field in the body | 400, without naming it back                 | yes                | yes   |
| uniqueness                   | none                                        | no                 | —     |
| the bounds of `limit`        | 0 … `MAX_SAFE_INTEGER`, and `1e400` refused | yes, as a question | yes   |

## What it surfaced

Seven decisions, all recorded in the final message and none asked. The same
five as D1a — in-memory storage, per-caller ownership answering 404 rather
than 403, the 1000-record cap at 409, the length limits handed back as _"change
these if they're wrong"_, and booleans that refuse `null` — plus two of its
own:

- **`1e400` is valid JSON and parses to `Infinity`**, so finiteness is tested
  rather than assumed from the format. D1a bounded `limit` and did not say this.
- **`src/auth.ts` accepted a token whose `sub` was not a string.** D1a found the
  same thing. Two independent runs reaching it is not luck: both chose to own
  records by `sub`, and the hazard follows from the design rather than from
  inspection.

## It checked its own tests, which nothing asked for

> As a check on the tests, I broke the owner check and the `sub` check on
> purpose: 5 tests failed, then passed again once I put the code back.

A mutation test, run by the agent on itself. No acceptance check asks for one,
and this is the second time a D1 run has done something below the gate's
resolution without being told to.

## What it did not find

**The prototype-key defect in `src/body.ts`.** D1a found it — `key in shape`
accepts `constructor`, `toString` and `__proto__` — and fixed it. This run
changed the same file, adding the `number` field the task needs, and left the
membership test as it was. One of two, so far: the defect is findable and not
reliably found, which is the argument for the deterministic check rather than
for trusting a read-through.

## Notes

No input after the first prompt. The new tests went into `src/app.test.ts`
rather than a new file, which `check 1b` is indifferent to and `npm test`
reaches either way.
