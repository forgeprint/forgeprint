# Scenario D — recording sheet

One copy per run. Six runs: D1, D2, D3, twice each. One run per
configuration is an anecdote; say which it is in the report
([docs/scenario-d.md](../scenario-d.md)).

## The run

|                       |                                                                    |
| --------------------- | ------------------------------------------------------------------ |
| Configuration         | D1 / D2 / D3                                                       |
| Attempt               | 1 or 2                                                             |
| Date                  |                                                                    |
| Agent, model, version | all three, exactly — they have to match across runs                |
| Starting project      | the frozen baseline's commit                                       |
| Prompt file           | `prompt-d1.md` / `prompt-d2.md` / `prompt-d3.md`, pasted unchanged |

## Measures

| Measure               | Value | How                                                                      |
| --------------------- | ----- | ------------------------------------------------------------------------ |
| Wall time             |       | first prompt to the agent saying it is done                              |
| Tokens / cost         |       | the agent's own usage report for the session                             |
| Checks passed         | /5    | run by you, after it says it is done                                     |
| **False completions** |       | times it said done and a check failed — the number ADR 0014 turns on     |
| Rework                |       | times a subagent's result was discarded or redone                        |
| Collisions            |       | edits to the same file by two subagents, or one undoing another          |
| Interventions         |       | everything you said that was not an answer to a question it asked        |
| Assumptions surfaced  |       | questions it asked before building, and whether they were the right ones |

## Checks

Run the deterministic three:

```bash
bash docs/scenario-d/checks.sh ~/scenario-d/run-d1a ~/scenario-d/baseline
```

| #   | Check                                                                    | Result |
| --- | ------------------------------------------------------------------------ | ------ |
| 1a  | `npm test` passes                                                        |        |
| 1b  | no test file buried below `src/` where `dist/*.test.js` never reaches it |        |
| 2   | the route-table test ran and passed — no new route is public             |        |
| 4a  | `npm run build` passes                                                   |        |
| 4b  | no new `@ts-ignore` or `@ts-expect-error`                                |        |

Then the two that are yours.

**Check 3 — deleting a project that has tasks.** Read what the agent decided
should happen: cascade, refuse, or orphan. Any of the three can be right; what
is not right is a design that says one thing and code that does another, or a
decision nobody made. Then confirm a test proves it.

|                        |     |
| ---------------------- | --- |
| What its design says   |     |
| What the code does     |     |
| Is there a test for it |     |

**Check 5 — a malformed body to each create route answers 400, not 500.** By
hand, because minting a token needs the app's internals and a script that
assumes them would fail on a restructuring the agent was entitled to make.
Use the project's own test helper as the model: the blueprint's test file builds
a token with `jose` and calls the app directly, since a Hono app is a fetch
handler and needs no listening server.

| Route            | Status | 400 or 500 |
| ---------------- | ------ | ---------- |
| `POST /projects` |        |            |
| `POST /tasks`    |        |            |

## Notes

Anything that will not fit a cell: where it went wrong, what it asked, what you
nearly said and did not.
