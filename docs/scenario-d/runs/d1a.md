# D1, attempt 1 — 2026-10-06

The baseline: one agent, no subagents. Filled from
[`record.md`](../record.md).

## The run

|                  |                                                                           |
| ---------------- | ------------------------------------------------------------------------- |
| Configuration    | D1                                                                        |
| Attempt          | 1                                                                         |
| Date             | 2026-10-06                                                                |
| Agent            | Claude Code, headless (`claude -p`)                                       |
| Model            | `claude-opus-5-5`                                                         |
| Starting project | `ts-http-service` 1.2.0, `framework=hono`, 21 recipe steps verified       |
| Prompt file      | [`prompt-d1.md`](../prompt-d1.md), read from the file rather than retyped |

Invocation, identical for every run of this round:

```bash
claude -p --strict-mcp-config --model opus \
  --permission-mode bypassPermissions --output-format json "$PROMPT"
```

### What the environment was, and what that costs

- **Headless.** The agent cannot ask a question, so **interventions** and
  **assumptions surfaced** are structurally zero rather than measured. Two of
  the eight measures are therefore absent from this round, and D3's expert says
  to decide whether to split _before_ splitting — advice a run that cannot ask
  is only half able to follow.
- **`--bare` was dropped.** It skips hooks, plugins and auto-memory, which is
  what the protocol's "clean session" asks for, but it also drops
  authentication: the first attempt failed in 76 ms with
  `Not logged in · Please run /login`. What its absence costs was measured
  rather than assumed — there are no hooks configured, so the only difference
  is plugins.
- **One plugin loaded:** `forgelore@forgeprint`. No MCP servers
  (`--strict-mcp-config`), no project-level settings, no memory for this
  project.

## Measures

| Measure               | Value                                                | How                                |
| --------------------- | ---------------------------------------------------- | ---------------------------------- |
| Wall time             | **132 s**                                            | `duration_ms` 130 871, API 125 895 |
| Turns                 | 8                                                    |                                    |
| Cost                  | **$0.677**                                           | the session's own usage report     |
| Tokens                | out 15 817 · cache read 348 310 · cache write 36 317 | input proper: 16                   |
| Checks passed         | **5 of 5**                                           | run after it said it was done      |
| **False completions** | **0**                                                | it said done and every check held  |
| Rework                | 0                                                    | no subagent to discard             |
| Collisions            | 0                                                    | no subagent to collide             |
| Interventions         | —                                                    | not measurable headless            |
| Assumptions surfaced  | —                                                    | not measurable headless            |

`subagent_stats.spawned` is **0**, so D1's defining condition is measured
rather than assumed.

## Checks

```
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test
note   assertions: 98, # pass 94 # fail 0
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

**Check 3 — deleting a project that has tasks.** Cascade, and it is consistent
in all three places:

|                        |                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| What its design says   | `store.ts` — "Deleting a project deletes its tasks: a task has no meaning without one."       |
| What the code does     | `deleteProject` removes the project, then every task whose `projectId` matches                |
| Is there a test for it | yes — "deleting a project takes its tasks with it": 204, then 404 on the task and on the list |

**Check 5 — a malformed body answers 400, not 500.** Eight cases, two create
routes by four bodies: unparseable, valid JSON that is not an object, an empty
object, and wrong types. All eight answered 400; no 5xx.

Run with [`check5.mjs`](../check5.mjs), which lives outside the run directory
and resolves `jose` from the project's own `node_modules`, so that running the
check cannot change what is being checked. `git status` after the checks shows
only the six paths the agent touched.

## What it built

```
 CLAUDE.md       |   5 +-
 src/app.test.ts | 414 +++++++++++++++++++-
 src/app.ts      |  94 ++++++++++-
 src/auth.ts     |   8 +-
 4 files changed, 514 insertions(+), 7 deletions(-)
 + src/store.ts, src/validate.ts
```

Eight new routes, with tasks nested under their project
(`/projects/:projectId/tasks`) rather than at the top level — a design decision
nobody asked for and nothing in the task forbade.

## Notes

Nothing to report: no intervention was possible, none was needed, and the run
ended on its own after eight turns.
