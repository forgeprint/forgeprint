# Handoff

Run every time a worker says a task is finished. The worker's word moves the
task to `submitted`; only these checks move it further.

| #   | Check                                                                                  | How                                                           | Source                                |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| H1  | The task's `verify` commands were run again after the change, not by the worker        | run them yourself; the worker's log is not evidence           | Anthropic BEA 2024; Scrum Guide 2020  |
| H2  | Their output is saved under `evidence/<task-id>/` with the command and exit code       | the directory exists and is not empty                         | MAST v3, task verification            |
| H3  | Every acceptance criterion is met, one by one                                          | read each against the evidence                                | Scrum Guide 2020                      |
| H4  | The change stayed inside the task's `paths`                                            | `git diff --name-only` against the task's `paths`             | CODEOWNERS                            |
| H5  | No frozen contract was changed                                                         | `git diff` on the contract files is empty                     | CDC 2006; Cognition 2025, principle 2 |
| H6  | The status is `verified` or `rejected` with a reason — never left at `submitted`       | read the plan                                                 | MAST v3, task verification            |
| H7  | A rejection counts against the attempt budget, and an exhausted budget means `blocked` | compare attempts used with allowed                            | Anthropic BEA 2024; Fowler 2014       |
| H8  | A blocked task went to the user with what was tried, and its criteria were not lowered | the report says so; `acceptance` is unchanged in `git log -p` | Scrum Guide 2020                      |

## Why each one

**H1 is the whole expert in one row.** A worker that says its tests passed is
telling you what it believes. Running them again is what turns belief into
evidence, and it costs one command.

**H4** catches the rejection a green test run hides: a worker that fixed its
task by editing somebody else's file. The tests pass today, and the other
worker's branch breaks tomorrow.

**H8** exists because the easiest way to close a blocked task is to decide it
did not need to pass. That removes the failure from the report and leaves it in
the software.
