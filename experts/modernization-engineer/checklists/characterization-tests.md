# Characterization tests

Before legacy code changes, a test records what it does now. Not what it
should do — what it does.

| #   | Check                                                                                        | How                                                                                       | Source                                                         |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| CT1 | The change points are named: files and functions the change will touch                       | read the refactoring plan                                                                 | Feathers, _Working Effectively with Legacy Code_ (2004), ch. 2 |
| CT2 | Test points are named: where behaviour of the change points can be observed                  | read the refactoring plan                                                                 | Feathers (2004), ch. 2 and ch. 11                              |
| CT3 | Characterization tests assert what the code currently returns, including surprising results  | read the assertions; surprising ones carry a comment saying they record current behaviour | Feathers (2004), ch. 13                                        |
| CT4 | The tests pass against the unchanged code                                                    | check out the commit before the change and run them                                       | Feathers (2004), ch. 13                                        |
| CT5 | The tests were committed before the change                                                   | `git log --format='%h %ad %s' -- <test path>` precedes the change commit                  | Feathers (2004), ch. 2 — the legacy code change algorithm      |
| CT6 | Coverage of the change points' lines is read, not assumed                                    | run with coverage; the report shows the change point's lines executed                     | Feathers (2004), ch. 13                                        |
| CT7 | Dependencies broken to get the code under test use named techniques, and change no behaviour | the commit names the technique (e.g. Extract Interface, Parameterize Constructor)         | Feathers (2004), ch. 25; Fowler, _Refactoring_, 2nd ed. (2018) |
| CT8 | A surprising behaviour found by a test is changed, if at all, in a separate commit           | no commit both refactors and changes an asserted result                                   | Fowler, _Refactoring_, 2nd ed. (2018), ch. 2 — the two hats    |

## Why each one

**CT3** is the difference between a characterization test and the tests an
agent writes by default. A test that asserts what the code _should_ do fails on
day one against legacy code, gets "fixed" to match, and the fix is a behaviour
change nobody reviewed.

**CT5** makes the discipline provable. Tests committed after the change could
have been written to fit it; the commit order says which way round it was.

**CT8** keeps refactoring honest. A structural change that also alters a result
is two changes, and the second one needs its own review.
