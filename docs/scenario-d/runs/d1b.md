# D1, attempt 2 — 2026-10-06

The baseline, second run. Environment identical to
[attempt 1](d1a.md): headless `claude -p`, `claude-opus-5-5`,
`--strict-mcp-config`, one plugin (`forgelore@forgeprint`), no hooks, no memory,
the same frozen baseline and the same prompt read from
[`prompt-d1.md`](../prompt-d1.md).

## Measures

| Measure               | Value            | Attempt 1        |
| --------------------- | ---------------- | ---------------- |
| Wall time             | **138 s**        | 132 s            |
| Turns                 | 9                | 8                |
| Cost                  | **$0.694**       | $0.677           |
| Tokens out            | 15 999           | 15 817           |
| Cache read / write    | 404 388 / 36 593 | 348 310 / 36 317 |
| Checks passed         | **7 of 7**       | 7 of 7           |
| **False completions** | **0**            | 0                |
| Subagents spawned     | **0**            | 0                |
| Rework / collisions   | 0 / 0            | 0 / 0            |
| Interventions         | —                | —                |
| Assumptions surfaced  | —                | —                |

The two baseline runs are within 5% of each other on time, cost and output
tokens. That is worth knowing before D2: a difference smaller than that is
noise, not a finding.

## Checks

```
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test
note   assertions: 77, # pass 71 # fail 0
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

Check 5: eight malformed bodies across both create routes, all **400**, no 5xx.
`check5.mjs` ran unchanged, which is itself a small result — it assumes
`createApp` is exported from `dist/app.js` and that tasks are reachable under a
project, and both runs happened to arrange it that way.

**Check 3 — deleting a project that has tasks.** This run **refuses**, where
attempt 1 cascaded.

|                        |                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| What its design says   | nothing in the code; the decision is explained only in the session's closing summary, and in the test's name |
| What the code does     | `deleteProject` returns `'conflict'` when any task has that `projectId`; the route answers **409**           |
| Is there a test for it | yes — "refuses to delete a project that still has tasks"                                                     |

Consistent, so the check passes. Worth recording that the _reason_ lives
outside the repository: attempt 1 wrote "a task has no meaning without one"
into `store.ts`, where the next reader finds it. Attempt 2's reasoning survives
only in a transcript.

## The same task, solved two ways

Neither is wrong — the protocol says cascade, refuse and orphan can all be
right — and both are internally consistent. The divergence is the point worth
carrying into D2 and D3, where two agents making this choice _differently in
the same run_ is precisely the collision the principles exist to prevent.

|                                | Attempt 1                 | Attempt 2                 |
| ------------------------------ | ------------------------- | ------------------------- |
| Delete a project holding tasks | cascade, 204              | refuse, 409               |
| Where the new tests went       | appended to `app.test.ts` | a new `resources.test.ts` |
| Assertions                     | 94                        | 71                        |

Two unprompted changes were common to both: each edited `auth.ts` to refuse a
token whose `sub` is empty or not a string, and each nested tasks under their
project rather than exposing `/tasks` at the top level. Nothing in the task
asked for either.

## What it built

```
 CLAUDE.md   | 10 ++++++-
 src/app.ts  | 96 +++++++++++++++++++++++
 src/auth.ts |  9 +++++-
 3 files changed, 113 insertions(+), 2 deletions(-)
 + src/resources.test.ts, src/store.ts, src/validation.ts
```

## Notes

Nothing to report: headless, so no question could be asked and no intervention
was possible. The run ended on its own after nine turns.

## Re-checked after the gate was fixed

D3's first turn passed this script with no implementation at all, so
`check 0` and `check 1c` were added. This run was re-checked against the
stronger gate and passes it — 7 of 7 where it used to read 5 of 5. The
verdict did not move; only the denominator did.
