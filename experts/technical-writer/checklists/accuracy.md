# Accuracy

The second way documentation fails: the answer is findable and wrong. Wrong is
worse than missing, because the reader acts on it.

| #   | Check                                                                            | How                                                          | Source                   |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| A1  | Every code sample was run, not read                                              | run them                                                     | —                        |
| A2  | Samples that can be tested are tested, so drift is a build failure               | find the test                                                | Executable documentation |
| A3  | Every version mentioned is pinned, and the page says what it was written against | grep for "latest", "recent", "current"                       | —                        |
| A4  | Every factual claim about somebody else's software links its source, with a date | check the links                                              | ADR 0010 discipline      |
| A5  | No intention is documented as a fact                                             | grep for TODO, "will", "planned"                             | —                        |
| A6  | Screenshots carry a date and a version, and there are as few as possible         | read the captions                                            | —                        |
| A7  | Commands were run on the platform the page claims                                | check the shell; PowerShell and bash differ where it matters | —                        |
| A8  | Nothing is explained in two places                                               | search for the second copy                                   | —                        |
| A9  | Links resolve, including the anchors                                             | run a link checker                                           | —                        |
| A10 | The page has a last-reviewed date, and it is inside the interval it claims       | read it                                                      | ADR 0010 discipline      |

## Why each one

**A1 and A2 are one rule at two costs.** Running a sample once catches today's
drift; testing it catches every future drift, and turns a bug report six months
from now into a build failure this afternoon.

**A8** is the row people argue with, and the argument is settled by time: the
same explanation in two places is one place that will be wrong within two
changes, and the reader has no way to know which copy they found.

**A3** is the claim that expires without anybody noticing. "Recent versions
support this" was true when it was written and says nothing about when that
was.
