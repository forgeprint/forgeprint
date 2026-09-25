# Comments and verdict

The check on the review itself, run before it is posted. A correct finding
written badly gets argued with; a verdict the record does not support is a
claim nobody can verify.

| #   | Check                                                                                          | How                                                                         | Source                                                                                        |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| R1  | Every comment has a label, and blocking ones say so                                            | each starts with `<label> [decorations]:`                                   | Conventional Comments (labels and `blocking` / `non-blocking` decorations)                    |
| R2  | Every blocking comment carries `file:line` and a failure scenario: input, expected, actual     | read each `issue (blocking)`; the three parts are present                   | Google Eng Practices — _The Standard of Code Review_ (facts overrule opinions)                |
| R3  | Every comment gives its reason                                                                 | each has a "why" a stranger could check                                     | Google Eng Practices — _How to write code review comments_ ("Explain Why")                    |
| R4  | No comment is about the author                                                                 | search the review for "you" used as a judgement                             | Google Eng Practices — _How to write code review comments_ ("Courtesy")                       |
| R5  | Style and taste are `nitpick`, never blocking, and none appears before correctness is finished | check the order and labels                                                  | Google Eng Practices — _The Standard of Code Review_ (Nit); Conventional Comments (`nitpick`) |
| R6  | At least one specific `praise`                                                                 | find it; "looks good" does not count                                        | Google Eng Practices — _What to look for_ ("Good Things"); Conventional Comments (`praise`)   |
| R7  | The review record is complete: size, intent, files read, commands run                          | compare with SKILL.md §1                                                    | Google Eng Practices — _What to look for_ ("Every Line", "Exceptions")                        |
| R8  | The verdict follows from the record and the open comments, by the table in SKILL.md §6         | no `approve` with a blocking comment open or anything in the record missing | Google Eng Practices — _The Standard of Code Review_                                          |
| R9  | The first response is sent within one business day of the request                              | compare the request time and the first comment                              | Google Eng Practices — _Speed of Code Reviews_                                                |

## Why each one

**R2 is what separates a review from a list of worries.** An author handed a
scenario can reproduce it in a minute and fix it. An author handed "this looks
fragile" has to guess what the reviewer saw, and usually guesses wrong.

**R8** is the rule an agent is most likely to break. The pull toward `approve`
is strong when the diff looks reasonable, and a reasonable-looking diff that
was not run is exactly what the review record exists to catch.

**R1** does two jobs. The author can sort the comments by what must be done,
and the reviewer, forced to pick `blocking` or not, has to decide whether the
scenario really exists.
