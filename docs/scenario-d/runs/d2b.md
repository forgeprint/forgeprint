# D2, attempt 2 — 2026-10-06

Splitting allowed, nothing else. Environment identical to [D1](d1a.md); the
prompt is [`prompt-d2.md`](../prompt-d2.md).

## It did not split either

```
subagent_stats: { "spawned": 0, "completed": 0, "max_depth": 0,
                  "requested": { "background": 0, "foreground": 0, "unset": 0 } }
```

Two of two. With two runs this stops being an anecdote: **offered subagents for
this task, with this wording, the agent does not take them.** Neither run
requested one, so nothing was refused by a limit either — the option was simply
not used.

**What follows for the round.** D2 was supposed to isolate "what splitting does
on its own". That condition was never created, so there is nothing to compare
D1 against on that axis. What the four runs do establish is the baseline's
spread and that the permission has no observable effect.

**What follows for D3.** D3 is D2 plus the expert. If D3 also does not split,
the round measures the expert's effect on a single-agent run — a narrower
question, but a real one, and the only one these runs can answer. If D3 _does_
split, the cause is the expert, which is a sharper result than the one the
protocol was designed to look for.

## Measures

| Measure               | D2b        | D2a    | D1a    | D1b    |
| --------------------- | ---------- | ------ | ------ | ------ |
| Wall time             | **116 s**  | 104 s  | 132 s  | 138 s  |
| Turns                 | 10         | 9      | 8      | 9      |
| Cost                  | **$0.629** | $0.568 | $0.677 | $0.694 |
| Tokens out            | **14 130** | 12 017 | 15 817 | 15 999 |
| Checks passed         | 7 of 7     | 7 of 7 | 7 of 7 | 7 of 7 |
| **False completions** | **0**      | 0      | 0      | 0      |
| Subagents spawned     | **0**      | 0      | 0      | 0      |
| Rework / collisions   | 0 / 0      | 0 / 0  | 0 / 0  | 0 / 0  |
| Test assertions       | **73**     | 49     | 94     | 71     |

**The assertion count is noise, not a trend.** D2a's record called it a falling
trend on three points — 94, 71, 49 — and this run answers that with 73. Four
runs of the same prompt-and-task produce 94, 71, 49, 73, which is a spread of
roughly two to one with no relation to the configuration. Correcting it here
rather than leaving it: three points in a row are a line only if you stop
looking.

## Checks

```
PASS   check 4a  npm run build
PASS   check 4b  no new type suppressions (0, baseline 0)
PASS   check 1a  npm test
note   assertions: 77, # pass 73 # fail 0
PASS   check 1b  no test file is buried where npm test cannot reach it
PASS   check 2   the route-table test ran and passed
```

Check 5: eight malformed bodies, both create routes, all 400, no 5xx.

**Check 3 — deleting a project that has tasks.** Cascade.

|                        |                                                                                |
| ---------------------- | ------------------------------------------------------------------------------ |
| What its design says   | no comment in the code; the intent is in the test's name                       |
| What the code does     | `deleteProject` removes the project, then every task whose `projectId` matches |
| Is there a test for it | yes — "DELETE removes the project's tasks with it"                             |

Four runs, three cascade and one refuse. All four self-consistent, all four
pass.

## The most thorough suite of the four

Forty tests, including cases nothing asked for: `415` for a body that is not
JSON, `413` for an oversized one, and the per-route refusal tests generated over
the whole route table rather than written out. This is the run that most
resembles what the task's author would have wanted, and it came from the same
prompt as the run with half the assertions.

## Notes

Headless, so no question could be asked and no intervention was possible. The
run ended on its own after ten turns.

## Re-checked after the gate was fixed

D3's first turn passed this script with no implementation at all, so
`check 0` and `check 1c` were added. This run was re-checked against the
stronger gate and passes it — 7 of 7 where it used to read 5 of 5. The
verdict did not move; only the denominator did.
