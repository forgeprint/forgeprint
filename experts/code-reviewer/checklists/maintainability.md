# Maintainability

The pass after correctness. Everything here is about the next person who reads
the code, and most of it is non-blocking unless a concrete cost can be named.

| #   | Check                                                                                                | How                                                                                            | Source                                                                     |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| M1  | Nothing is built for a need the change does not have                                                 | for each new abstraction, parameter or extension point, find its second user                   | Google Eng Practices — _What to look for_ ("Complexity", over-engineering) |
| M2  | A reader can follow each function without the author present                                         | explain a function back in one sentence; where you cannot, it is a `question:`                 | Google Eng Practices — _What to look for_ ("Complexity")                   |
| M3  | Names say what a thing is or does, at a length that fits its scope                                   | read each new name without its body                                                            | Google Eng Practices — _What to look for_ ("Naming")                       |
| M4  | Comments explain why, not what; no comment restates the line under it                                | read each new comment against its code                                                         | Google Eng Practices — _What to look for_ ("Comments")                     |
| M5  | New code follows the project's style guide, and where the guide is silent, the surrounding code      | compare with the file it sits in; defer to the linter where one exists                         | Google Eng Practices — _What to look for_ ("Style", "Consistency")         |
| M6  | Documentation that describes changed behaviour is changed in the same diff                           | search the docs and README for the changed name or flag                                        | Google Eng Practices — _What to look for_ ("Documentation")                |
| M7  | Code the change makes unreachable is deleted, not commented out or left behind                       | search for the callers of what the change replaced                                             | Google Eng Practices — _What to look for_ ("Context")                      |
| M8  | Structure that should change but not in this diff becomes a refactoring plan, not a blocking comment | a `suggestion:` pointing at the plan; each step behaviour-preserving and separately reviewable | Fowler, _Refactoring_; Google — _Small CLs_ ("Separate Out Refactorings")  |

## Why each one

**M1 is the one worth blocking on.** Speculative generality costs every future
reader and is paid for by no current user. The test is concrete: an
abstraction with one implementation and one caller is indirection, and the
reviewer can name both.

**M8** keeps the review honest about scope. The reviewer who spots a structural
problem has two bad options, blocking an unrelated change or saying nothing,
and one good one: write the plan, attach it, approve the change in front of
them.

**M5** is last for a reason. Style a formatter can enforce is not a review
comment at all, and style it cannot is a `nitpick`.
