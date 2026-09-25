# Acceptance criteria

The examples that decide whether a story is done, written so a parser accepts
them and a tester can fail them.

| #   | Check                                                                                     | How                                                               | Source                                                      |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| AC1 | Every story has at least one example in Gherkin that a Cucumber-compatible parser accepts | parse the `.feature` file or block                                | Gherkin reference (Cucumber documentation)                  |
| AC2 | `Given` sets a known state and does not describe user interaction                         | read each `Given`; clicks and typing belong in `When`             | Gherkin reference — Given                                   |
| AC3 | `Then` asserts an observable output: a report, a screen, a message                        | read each `Then`; a database row or internal flag is a finding    | Gherkin reference — Then                                    |
| AC4 | Each example has 3–5 steps                                                                | count steps per example                                           | Gherkin reference — Example                                 |
| AC5 | A `Background` is short and holds only what the reader needs to remember                  | count its lines; more than four is a finding                      | Gherkin reference — Background                              |
| AC6 | Variations of data are one `Scenario Outline` with `Examples`, one row per partition      | look for scenarios that differ only by a value                    | Gherkin reference — Scenario Outline                        |
| AC7 | Examples illustrating one business rule are grouped under a `Rule`                        | find the `Rule` keyword where a story states a rule               | Gherkin reference — Rule (Gherkin 6)                        |
| AC8 | Every story is testable: at least one example could fail                                  | for one example, describe the system behaviour that would fail it | Bill Wake, INVEST in Good Stories (2003) — Testable         |
| AC9 | Every example traces to a requirement ID                                                  | a tag or comment on each scenario names the ID                    | BABOK v3, technique 10.1 Acceptance and Evaluation Criteria |

## Why each one

**AC3 is the difference between a criterion and an implementation note.** An
outcome checked inside the system passes while the user sees nothing; the
reference is explicit that outcomes are outputs somebody can observe.

**AC6** keeps the examples reviewable. Ten copies of a scenario that differ by
one value hide which partitions and boundaries were covered; one outline with
an examples table shows them.

**AC9** connects the criteria to the trace matrix, so a failing example names
the requirement it breaks.
