# D2, attempt 1 — 2026-10-06

Splitting allowed, nothing else. Environment identical to
[D1](d1a.md); the only difference from it is one sentence in
[`prompt-d2.md`](../prompt-d2.md): _"You may split the work across subagents."_

## It did not split

```
subagent_stats: { "spawned": 0, "requested": { ... all zero } }
```

Given permission, the agent used none of it, and said nothing about splitting,
parallelism or subagents in its closing message — the subject never came up
rather than being considered and declined.

**So this run did not measure what D2 exists to measure.** It is a D1 run with a
longer prompt. What it measured instead is that an agent offered the option
declined to take it, which the protocol had already named as a likely outcome:
_"splitting costs tokens and coordination, and a small task may not repay it."_
Here the agent appears to have reached that conclusion without being asked to.

One run cannot carry that claim. D2's second attempt decides whether this is the
agent's judgement about this task or an artefact of a permissive sentence.

## Measures

| Measure               | D2a              | D1a              | D1b              |
| --------------------- | ---------------- | ---------------- | ---------------- |
| Wall time             | **104 s**        | 132 s            | 138 s            |
| Turns                 | 9                | 8                | 9                |
| Cost                  | **$0.568**       | $0.677           | $0.694           |
| Tokens out            | **12 017**       | 15 817           | 15 999           |
| Cache read / write    | 344 897 / 32 357 | 348 310 / 36 317 | 404 388 / 36 593 |
| Checks passed         | 7 of 7           | 7 of 7           | 7 of 7           |
| **False completions** | **0**            | 0                | 0                |
| Subagents spawned     | **0**            | 0                | 0                |
| Rework / collisions   | 0 / 0            | 0 / 0            | 0 / 0            |
| Test assertions       | **49**           | 94               | 71               |

Faster, cheaper and with fewer output tokens than either baseline run — by more
than the 5% the two baselines differed by, so the gap is outside the noise the
baseline established. Reading it as "D2 beats D1" would be wrong, though: no
splitting happened, so the comparison is between two D1-shaped runs whose
prompts differed by a sentence.

**The assertion count varies widely across runs and has nothing to do with the
prompt:** 94, then 71, then 49 — and D2b's 73 afterwards, which is why
[that record](d2b.md) corrects this paragraph's original reading of a falling
trend. Three points in a row are a line only if you stop looking. Check 1 only asks for a test per route and per
refusal, and all three pass it, so the gate does not see this. It is the kind of
variation that a five-check gate is not built to catch, and it belongs in the
report rather than in a footnote.

## Checks

```
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test
note   assertions: 53, # pass 49 # fail 0
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

Check 5: eight malformed bodies, both create routes, all 400, no 5xx.

**Check 3 — deleting a project that has tasks.** Cascade, as D1a chose and
unlike D1b.

|                        |                                                                            |
| ---------------------- | -------------------------------------------------------------------------- |
| What its design says   | no comment in the code; the intent is in the test's name                   |
| What the code does     | `deleteProject` removes every task with that `projectId`, then the project |
| Is there a test for it | yes — "deleting a project deletes its tasks"                               |

The three runs so far have split 2–1 on this decision. All three are
self-consistent and all three pass.

## What it built

```
 src/app.ts | 84 +++++++++++++++++++++++-
 1 file changed, 83 insertions(+), 1 deletion(-)
 + src/resources.test.ts, src/store.ts, src/validation.ts
```

The narrowest footprint of the three: it did not touch `auth.ts`, which both
baseline runs changed unasked.

## Notes

Headless, so no question could be asked and no intervention was possible. The
run ended on its own after nine turns.

## Re-checked after the gate was fixed

D3's first turn passed this script with no implementation at all, so
`check 0` and `check 1c` were added. This run was re-checked against the
stronger gate and passes it — 7 of 7 where it used to read 5 of 5. The
verdict did not move; only the denominator did.
