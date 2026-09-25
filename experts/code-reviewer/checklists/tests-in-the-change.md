# Tests in the change

Not whether the suite is healthy — that belongs to `qa-automation-lead`. Only
whether this diff carries the tests for what this diff changes.

| #   | Check                                                                                            | How                                                                                       | Source                                                                       |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| T1  | Every behaviour the change adds or alters has a test in the same change                          | list the behaviours from the intent; find a test for each                                 | Google Eng Practices — _What to look for_ ("Tests")                          |
| T2  | Each new test fails without the change                                                           | run the new test against the base commit's code, or name the line whose removal breaks it | Google Eng Practices — _What to look for_ ("tests do not test themselves")   |
| T3  | A bug fix carries a test that reproduces the bug                                                 | the test's input is the bug report's input                                                | Google Eng Practices — _Small CLs_ ("Keep related test code in the same CL") |
| T4  | The tests assert on the outcome the intent describes, not only that nothing threw                | read each assertion; name the scenario it would catch                                     | Google Eng Practices — _What to look for_ ("Tests")                          |
| T5  | Deleted or weakened assertions are explained in the description                                  | diff the test files for removed assertions and loosened expectations                      | Google Eng Practices — _Writing good CL descriptions_                        |
| T6  | The failure scenarios raised in the correctness pass are each covered, or named as missing tests | for every `issue` from `correctness.md`, a test exists or a `todo:` asks for one          | Google Eng Practices — _What to look for_ ("Tests")                          |
| T7  | A pure refactor changes no test expectation                                                      | if S3 says the change is a refactor, the test diff contains no changed assertion          | Fowler, _Refactoring_ (behaviour-preserving)                                 |

## Why each one

**T2 is the whole file.** A test written alongside the code often passes for the
wrong reason: it asserts on a value the fixture already had, or it never
reaches the new branch. Running it against the old code is the only direct
proof that it tests the change, and it takes one checkout.

**T5** catches the quiet way a failing test gets fixed: the assertion is
loosened until it passes. That can be right, when the old expectation was
wrong, but the description has to say so, or the reviewer is approving a
changed specification without knowing it.

**T7** is the refactoring contract in one line. A refactor that needs a changed
expectation has changed behaviour, and it is not a refactor.
