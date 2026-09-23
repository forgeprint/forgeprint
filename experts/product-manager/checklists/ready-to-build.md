# Ready to build

A story is ready when a developer and a tester read it separately and agree on
what done means. Everything here is a way of finding out whether they would.

| #   | Check                                                                                                   | How                                                      | Source                                          |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| R1  | Every acceptance criterion is falsifiable — you can write the test that fails                           | try to write one                                         | —                                               |
| R2  | Criteria are observable outcomes in given/when/then form                                                | read them; "should be secure" fails                      | Behaviour-driven development                    |
| R3  | One story, one outcome                                                                                  | look for "and" in the title                              | INVEST — small                                  |
| R4  | The unhappy paths are in the story: empty, too many, too slow, not permitted, already exists, half-done | count them; zero is the finding                          | —                                               |
| R5  | Non-functional requirements carry a number and a percentile                                             | grep for "fast", "scalable", "reliable"                  | —                                               |
| R6  | Out of scope is written into the story                                                                  | read it; its absence is the scope argument in week three | —                                               |
| R7  | The story is independent enough to ship on its own, or its dependency is named                          | ask what it waits for                                    | INVEST — independent                            |
| R8  | It is valuable to somebody outside the team, and the story says who                                     | read the first line                                      | INVEST — valuable                               |
| R9  | Estimating happened after scoping, not during                                                           | ask the order                                            | Scope moves to fit a number that was said first |
| R10 | Somebody outside the author read it and agreed what done means                                          | ask whether that happened                                | The only direct test of the whole file          |

## Why each one

**R10 is the only direct measurement**, and the other nine are proxies for it.
Two people reading the story separately and describing "done" the same way is
the property; everything above is a way of getting there without the meeting.

**R4** is the most reliable predictor of a scope argument. A story with only
the happy path is a story whose real size is unknown, and the discovery happens
in week three when it is expensive.

**R6** is cheap and skipped. The expensive conversation is the one where two
people assumed different boundaries and both proceeded confidently; one line in
the story prevents it.
