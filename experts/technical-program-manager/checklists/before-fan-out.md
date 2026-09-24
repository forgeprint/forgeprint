# Before fan-out

Run before any work is handed to a second agent. Every row is a file, a field,
or a count somebody else can repeat.

| #   | Check                                                                                              | How                                                  | Source                          |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| F1  | The width of the task graph is counted, and the decision to split or not is stated with the number | read the plan; count tasks with no path between them | MAST v3; Anthropic MA 2025      |
| F2  | The user's request is stored verbatim and has not been edited                                      | `git log -p delivery/brief.md` shows one version     | Cognition 2025, principle 1     |
| F3  | The spec has section identifiers, and every task's `spec_refs` points at one that exists           | grep each reference in the spec                      | Cognition 2025, principle 1     |
| F4  | Every assumption is logged, and every critical one is marked approved by the user                  | read `assumptions.md`; no critical row unapproved    | Cognition 2025, principle 2     |
| F5  | Every interface two branches share is written down and marked frozen                               | read `state.md`; the contract file exists            | CDC 2006; OpenAPI 3.2.1         |
| F6  | No two tasks list the same path, or one path under another                                         | compare every pair of `paths`                        | CODEOWNERS; Anthropic MA 2025   |
| F7  | Every task has acceptance criteria and a `verify` command for each                                 | read the plan; no empty field                        | Scrum Guide 2020; MAST v3       |
| F8  | Every task has an attempt budget                                                                   | read the plan                                        | Anthropic BEA 2024; Fowler 2014 |
| F9  | A thin end-to-end slice is built, verified and shown to the user — or the width is 1               | the slice's task is `verified`; the user has seen it | Cockburn, walking skeleton      |

## Why each one

**F1 is the row that saves the most.** Splitting a job with no parallel width
buys every cost of coordination — the tokens, the handoffs, the drift — and
none of the speed. The research this expert rests on found multi-agent gains
often minimal; the honest default is not to split.

**F4 is where one mistake becomes six.** A guess the coordinator makes is
inherited by every worker, and none of them will question it because it
arrived as an instruction. Asking the user once, before fan-out, is the
cheapest correction there will ever be.

**F6** is the rule that turns a collision from a surprise into a planning
error. Two workers that may both write a file will, and the second one wins
without anybody noticing.
