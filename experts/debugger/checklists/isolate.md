# Isolate

Make the failing input small and the suspect change range short before forming
a theory. A large case supports every theory at once.

| #   | Check                                                                                      | How                                                                                   | Source                                               |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| I1  | The failing input has been reduced until removing any part makes the failure go away       | try removing each remaining piece; each removal must pass                             | DD 2002; WPF ch. 5; Debugging Book — Reducing Inputs |
| I2  | Where the input is large or structured, the reduction was automated                        | name the tool or script used                                                          | DD 2002; Debugging Book — Reducing Inputs            |
| I3  | For a regression, a known good and a known bad commit were established by running the test | run the reproduction at both; record the hashes                                       | git-bisect                                           |
| I4  | The history was bisected with a script, not by hand                                        | `git bisect run <script>`; the script exits `0` good, `1`–`127` bad, `125` untestable | git-bisect; Agans, rule 4 (Divide and conquer)       |
| I5  | The bisect log is kept                                                                     | `git bisect log` output is in the root-cause analysis                                 | git-bisect; Agans, rule 6                            |
| I6  | The first bad commit is confirmed by reverting only that change on the bad commit          | revert it locally; the reproduction passes                                            | Debugging Book — Isolating Changes; WPF ch. 13       |
| I7  | The wrong state was traced backwards from the failure to the first place it became wrong   | the analysis names the variable, where it was last right and what wrote it            | WPF ch. 9; Debugging Book — Tracking Failure Origins |

## Why each one

**I1** pays for itself every time. Every piece removed is a piece that cannot be
the cause, and a three-line input makes the root cause readable in a way a
three-thousand-line one does not.

**I4** is where a script beats a person: the search is logarithmic only if
every step is judged the same way. A commit that cannot build is skipped with
`125`, not guessed at, or the result is wrong.

**I6** guards against a bisect that lands on the commit that _exposed_ the bug
rather than the one that introduced it. Both are real findings; they are not
the same finding.
