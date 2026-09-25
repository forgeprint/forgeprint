# Hypothesis log

Debugging is a sequence of experiments. The log is what turns them from a
string of edits into something another person can follow and check.

| #   | Check                                                                             | How                                                                        | Source                                                           |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| H1  | A hypotheses log exists beside the root-cause analysis                            | find it; one row per experiment                                            | WPF ch. 6; Agans, rule 6 (Keep an audit trail)                   |
| H2  | Every entry states a prediction and the observation that would refute it          | read each row; both columns are filled                                     | WPF ch. 6; Debugging Book — Introduction to Debugging            |
| H3  | The refuting observation was written before the experiment ran                    | the log's history, or its order in the commit, shows it                    | WPF ch. 6                                                        |
| H4  | Each experiment changed one thing                                                 | read the experiment column; one variable per row                           | Agans, rule 5 (Change one thing at a time)                       |
| H5  | Changes made for an experiment were reverted before the next one                  | `git diff` between experiments contains only the current one               | Agans, rule 5                                                    |
| H6  | Claims about a value rest on an observed value, not an inferred one               | each "Result" cites a printed value, a breakpoint or an assertion          | Agans, rule 3 (Quit thinking and look); WPF ch. 8                |
| H7  | Refuted hypotheses stay in the log                                                | count rows marked refuted; zero on a hard bug is suspicious                | WPF ch. 6                                                        |
| H8  | After several refuted hypotheses, the assumptions were re-checked from the bottom | the log has a row that tests a basic assumption: right build, right config | Agans, rule 7 (Check the plug); Agans, rule 8 (Get a fresh view) |

## Why each one

**H3 is the discipline, and the rest is bookkeeping.** A refuting observation
written after the result can always be chosen so the result does not refute
anything. Written first, it can fail.

**H4** is what makes a result mean something. If the cache was disabled and
the timeout raised in the same run, a pass says nothing about either.

**H8** exists because a long run of refuted hypotheses usually means the
experiment is not running what you think — a stale build, a different
configuration file, a cached dependency.
