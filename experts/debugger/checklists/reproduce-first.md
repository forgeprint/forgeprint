# Reproduce first

Nothing is changed until the failure can be made to happen on demand, and the
way to make it happen is in the repository before the fix is.

| #   | Check                                                                               | How                                                                            | Source                                            |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| R1  | A reproduction exists as a test, or as a script in the repository                   | find it by name in the diff                                                    | Agans, rule 2 (Make it fail); WPF ch. 4           |
| R2  | It fails for the reported reason, not for an incidental one                         | read its failure message; it names the wrong value the user saw                | WPF ch. 3                                         |
| R3  | It was committed before the fix                                                     | `git log --oneline`: the reproduction commit precedes the fix commit           | Agans, rule 6 (Keep an audit trail)               |
| R4  | Checked out alone, the reproduction commit fails                                    | `git checkout <repro-commit>`, run the test, expect red (or expected-fail)     | Agans, rule 9 (If you didn't fix it...)           |
| R5  | What it depends on is written down: version, configuration, platform, input, timing | read the root-cause analysis                                                   | WPF ch. 4                                         |
| R6  | It uses a synthetic input, never production data or a real credential               | read the fixture; grep for anything that looks like a real account or secret   | CLAUDE.md §5b                                     |
| R7  | A failure that would not reproduce is reported as such, with no behaviour change    | the pull request changes only logging or assertions, and says "not reproduced" | Agans, rule 3 (Quit thinking and look); WPF ch. 2 |

## Why each one

**R3 is the check that makes the rest verifiable.** A reproduction written after
the fix has only ever been seen passing. Committed first, its failure is on
record, and anybody can check out that commit and watch it.

**R2** catches the reproduction that fails for a different reason — a missing
fixture, a typo — and then "passes after the fix" because the fix happened to
touch the same file.

**R7** is the hardest to obey. The pressure is to ship something. A speculative
change to a failure nobody can trigger has no way to be shown right, and it
closes the ticket that would have collected the next occurrence.
