# Round 2, D1, attempt a — 2026-10-06

The baseline: one agent, no subagents. Prompt:
[`prompt-d1.md`](../prompt-d1.md). **One turn** — the
[answer policy](../reply.md) did not fire, because the run implemented without
stopping.

## The run

|                       |                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Configuration         | D1                                                                                                                      |
| Attempt               | a                                                                                                                       |
| Date                  | 2026-10-06                                                                                                              |
| Agent, model, version | Claude Code 2.1.291, headless (`claude -p`), `--model opus`                                                             |
| Starting project      | round 2's frozen baseline: `ts-http-service` 1.3.0, `framework=hono`, 22 recipe steps verified, 3 routes, 14 assertions |
| Prompt file           | [`prompt-d1.md`](../prompt-d1.md), read from the file by [`run.sh`](../run.sh)                                          |

## Measures

| Measure                         | Value                                                | How                                                              |
| ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Wall time                       | **123 s**                                            | `duration_ms` 118 233; the rest is copying the baseline          |
| Turns                           | 10                                                   | the session's own count                                          |
| Cost                            | **$0.623**                                           | the session's own usage report                                   |
| Tokens                          | out 12 369 · cache read 467 926 · cache write 35 256 | input proper: 20                                                 |
| Checks passed                   | **12 of 12**                                         | the eleven scripted, plus check 3, run after it said it was done |
| **False completions**           | **0**                                                |                                                                  |
| **Subagents spawned**           | **0**                                                | D1 allows none, so this is the floor rather than a result        |
| **Resources given to a worker** | 0 of 4                                               | not applicable to D1                                             |
| Rework                          | 0                                                    | no workers                                                       |
| Collisions                      | 0                                                    | no workers                                                       |
| Interventions                   | **0**                                                | the policy reply was not needed and was not sent                 |
| **Decisions surfaced**          | **8**                                                | below                                                            |
| **Decisions settled silently**  | **2 of 5**                                           | the second DELETE, and uniqueness                                |
| Test assertions                 | **137**                                              | 129 passing tests; the baseline ships 14                         |

## Checks

```
PASS   check 0   src/ changed, so there is something to check
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test            (# pass 129  # fail 0)
PASS   check 1c  more assertions than the baseline's 14
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed

PASS  check 0b  19 routes declared, floor 19 (baseline 3 + 16)
PASS  check 0b  /projects: 4 routes · /notes: 4 · /tags: 4 · /budgets: 4
PASS  check 5   16 malformed bodies, four create routes, no 5xx
PASS  check 6   24 coerced values, all 400
PASS  check 7   four refusals, none echoing the probe key or its value
```

**Check 6 and check 7 are new in round 2**, and this run passes both without
having been told they exist. `archived: null`, `pinned: null`, `limit: "10"`
and `limit: true` are all 400, and no refusal repeats what the caller sent.

## Check 3 — the four resources agree

One function, `addResource`, serves all four, so they cannot disagree. That is
worth saying plainly: with a single agent the consistency this check looks for
came **free**, as a consequence of how the work was factored rather than of any
care about the question. It is the comparison with a split run that will mean
something.

| Decision                     | All four                                  | Named?                 | Test?                                              |
| ---------------------------- | ----------------------------------------- | ---------------------- | -------------------------------------------------- |
| a second DELETE              | 404                                       | no                     | yes — `resources.test.ts`, in a loop over the four |
| an id that never existed     | 404, and a stranger's id answers the same | yes                    | yes                                                |
| an unknown field in the body | 400, without naming it back               | yes                    | yes                                                |
| uniqueness                   | none, on any field                        | no                     | —                                                  |
| the bounds of `limit`        | 0 … `MAX_SAFE_INTEGER`; negatives refused | yes, **as a question** | yes                                                |

## Decisions surfaced

Eight, all in the final message, none asked — the run recorded them and
finished:

1. Storage is in memory and is lost when the process restarts.
2. Every record belongs to the token's `sub`; a stranger gets 404 rather than
   403, so ids cannot be probed.
3. At most 1000 records per caller per resource; one more is 409.
4. Text fields may not be blank, with per-field length limits.
5. Booleans must be real booleans — `null`, `"true"` and `1` refused.
6. **`limit` refuses negatives, and the run said this was not specified:**
   _"say if you want them allowed"_. The one decision it handed back.
7. Unknown fields refused without repeating their names; `id` cannot be set.
8. Two defects in the baseline, fixed — the next section.

## It found two defects in the blueprint, and one of them is real

Neither was asked for, and the gate asks about neither.

**`src/body.ts` accepted prototype keys as declared fields.** The unknown-field
check was `!(key in shape)`, and `in` walks the prototype chain, so
`constructor`, `__proto__` and `toString` all passed as known fields. Verified
against the frozen baseline, which is `ts-http-service` 1.3.0 as published:

```
{"name":"ok","constructor":1}      -> 201
{"name":"ok","__proto__":{"x":1}}  -> 201
{"name":"ok","toString":1}         -> 201
```

The run changed it to `Object.hasOwn(shape, key)` with the reason at the line.
On `POST /items` the blast radius is small, because that route builds its
response field by field. On a route that spreads the validated body into a
stored record — which is exactly what this task asks for four times — a
`__proto__` key lands in the object. **This is a defect in the published
blueprint**, found by a measurement run rather than by a review.

**`src/auth.ts` accepted a token whose `sub` was not a string.**
`requiredClaims: ['sub']` checks that the claim is present, not that it is
usable, so `sub: 123` or `sub: ''` passed. With per-caller storage that would
have put every such caller in one bucket. The run added the type test and
exposed `subject` as a typed context variable.

The second is a consequence of the design this run chose, and arguably its own
business. The first is not: it was there before the run and it is there in the
catalog now.

## Notes

No input after the first prompt. `src/app.ts` grew 42 lines — the four
declarations — and `src/resources.ts` holds the 83 lines that serve them, with
`src/resources.test.ts` at 288. The run also added the new files and the
in-memory storage to the project's own `CLAUDE.md`, which nothing asked for.

For the round, the number to keep is **0 subagents at 12 of 12** — the floor
D2 and D3 have to beat on something other than cost.
