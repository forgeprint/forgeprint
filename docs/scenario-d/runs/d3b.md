# D3, attempt 2 — 2026-10-06

Splitting allowed, expert installed and named. Prompt:
[`prompt-d3.md`](../prompt-d3.md). **One turn** — the
[answer policy](../reply.md) never fired, because this run implemented without
stopping.

## It spawned a subagent, and not to split the work

```
subagent_stats: { "spawned": 1, "completed": 1, "failed": 0, "max_depth": 1,
                  "requested": { "foreground": 1 } }
```

The one subagent was a **read-only reviewer**, not a worker:

> I did the work as one agent rather than splitting it. A separate read-only
> reviewer then checked it and passed it.

So after six runs, **no run has split the work.** This is the first subagent of
the round and it was spent on verification.

The decision not to split is quantified in `delivery/assumptions.md`, A7:

> Single agent, no subagents: width is 2 after T1, the parallel part is ~150
> lines, and spawning workers that each re-read the codebase costs more than the
> work.

## The reviewer found defects the acceptance checks do not reach

> Independent reviewer (fresh subagent, read-only), checks 1–7 of plan T4: all
> PASS, 67/67. Findings: `done: null` accepted (fixed, test added); unknown key
> echoed in error (fixed); no content-type check (not fixed, open). Logs in this
> folder are the coordinator's re-run after those fixes: 68/68, exit 0.

Three findings: two fixed before the run ended, one left open **and recorded as
open**. The assertion count moved 67 → 68 as a result.

This is the most valuable thing the round has produced, and it is worth being
exact about why. The five acceptance checks would have passed this run _before_
the review: they ask whether the build builds, whether tests pass, whether a
route escaped the token, whether a malformed body 500s. `done: null` being
accepted is none of those. The reviewer operated below the gate's resolution —
which is the mechanism
[ADR 0014](../../decisions/0014-crew-runtime-deferred.md) asks about, and the
expert's rule that nothing counts as done until something other than the worker
has verified it.

## Assumptions recorded rather than asked

Where [attempt 1](d3a.md) stopped and asked four questions, this run wrote seven
assumptions into a table with `Critical` and `Approved` columns, marked each
_"no — taken as the conservative default; user did not ask to be consulted"_,
and proceeded.

Both are the expert's instruction followed; they are not the same behaviour. One
blocks on a human, one records and continues. That inconsistency inside a single
configuration belongs in the report rather than being averaged away.

## Measures

| Measure               | D3b              | D3a          | D1a    | D1b    | D2a    | D2b    |
| --------------------- | ---------------- | ------------ | ------ | ------ | ------ | ------ |
| Wall time             | **228 s**        | 207 s        | 132 s  | 138 s  | 104 s  | 116 s  |
| Turns                 | 14               | 20           | 8      | 9      | 9      | 10     |
| Cost                  | **$1.244**       | $1.369       | $0.677 | $0.694 | $0.568 | $0.629 |
| Tokens out            | 18 606           | 22 046       | 15 817 | 15 999 | 12 017 | 14 130 |
| Checks passed         | **7 of 7**       | 7 of 7       | 7 of 7 | 7 of 7 | 7 of 7 | 7 of 7 |
| **False completions** | **0**            | 0            | 0      | 0      | 0      | 0      |
| **Subagents spawned** | **1** (reviewer) | 0            | 0      | 0      | 0      | 0      |
| Rework                | 0                | 0            | 0      | 0      | 0      | 0      |
| Collisions            | 0                | 0            | 0      | 0      | 0      | 0      |
| Interventions         | 0                | 1, by policy | —      | —      | —      | —      |
| Assumptions surfaced  | **7, recorded**  | 4, asked     | —      | —      | —      | —      |
| Test assertions       | 68               | 75           | 94     | 71     | 49     | 73     |

## Checks

```
PASS   check 0   src/ changed, so there is something to check
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test            (# pass 68  # fail 0)
PASS   check 1c  more assertions than the baseline's 6
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

Check 5: eight malformed bodies, both create routes, all 400, no 5xx.

**Check 3 — deleting a project that has tasks.** 409, and this is the only run
that wrote the reason into the code at the point of the decision:

|                        |                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| What its design says   | `projects.ts` — "Refused rather than cascaded: deleting tasks the caller did not name"; and A4 in `delivery/assumptions.md` |
| What the code does     | answers 409 while any task remains                                                                                          |
| Is there a test for it | yes — "refuses with 409 while the project has tasks"                                                                        |

Six runs: three cascade, three refuse. All six self-consistent, all six pass.

## Notes

No input after the first prompt. The policy's reply was not needed and was not
sent.
