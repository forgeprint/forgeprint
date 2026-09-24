# Before "done"

Run before telling the user the job is finished. If any row fails, the job is
not finished, and the report says what it is instead.

| #   | Check                                                                 | How                                                 | Source                           |
| --- | --------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| D1  | Every task in the plan is `verified`                                  | read the plan; count statuses                       | Scrum Guide 2020                 |
| D2  | Every verified task has evidence on disk                              | each `evidence` path exists                         | MAST v3, task verification       |
| D3  | The whole thing passes together, not only task by task                | run the project's full test and build commands once | Anthropic BEA 2024, orchestrator |
| D4  | Open assumptions are listed in the report, not dropped                | compare `assumptions.md` with the report            | Cognition 2025, principle 2      |
| D5  | Rejected and blocked tasks are in the report with their reasons       | read the report                                     | MAST v3, task verification       |
| D6  | The report states what was **not** done, in its own section           | the section exists, even if it says "nothing"       | Scrum Guide 2020                 |
| D7  | The report is compared with `brief.md`, not with the spec or the plan | read them side by side                              | Cognition 2025, principle 1      |

## Why each one

**D3** is the check task-level verification cannot do. Five branches that each
pass on their own can still fail together — the integration is where parallel
work that silently disagreed finally shows it.

**D7** closes the loop to the one file nobody edited. The spec and the plan are
the coordinator's interpretation; the brief is what was asked. A job that
matches its own plan and misses the brief is finished work on the wrong thing.
