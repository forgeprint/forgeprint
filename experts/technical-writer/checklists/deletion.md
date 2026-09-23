# Deletion

The highest-value edit to most documentation is a deletion, and it is the one
nobody proposes unasked. This checklist is a list of things to look for and
remove.

| #   | Delete                                                   | How to find it                                        | Why                                                                      |
| --- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| D1  | "Simply", "just", "obviously", "of course", "easily"     | grep                                                  | No information, and they tell a stuck reader the problem is them         |
| D2  | The introduction that introduces the introduction        | read the first two paragraphs                         | The reader's question is further down than it needs to be                |
| D3  | Narration of a screenshot or a parameter list            | look beside every image and table                     | The reader can see it                                                    |
| D4  | The second copy of an explanation                        | search for it                                         | One of them is wrong within two changes                                  |
| D5  | Historical notes about how it used to work               | grep for "previously", "used to", "in older versions" | That belongs in a changelog or an ADR                                    |
| D6  | Hedges — "should", "generally", "in most cases"          | grep                                                  | Either knowledge nobody wrote down, or an admission the page is guessing |
| D7  | Passive voice that hides who acts                        | grep for "is deployed", "was configured"              | By whom, and when                                                        |
| D8  | A prose paragraph a table answers                        | look for three or more parallel facts in a row        | The reader is scanning                                                   |
| D9  | Apologies and disclaimers about the documentation itself | grep for "note that", "please be aware"               | They add length and no answer                                            |
| D10 | Anything the reader does not need to finish the task     | ask, per paragraph, which question it answers         | A page answers questions; the rest is furniture                          |

## Why each one

**D6 is the most useful row and the least obvious.** Every hedge is a fork: the
author either knows the condition and did not write it, in which case write it,
or does not know, in which case find out. "This should work on Windows" helps
nobody on Windows.

**D1** is the row people defend as friendliness. It is not friendly to the only
reader who matters here — the one who is stuck — because it tells them that
what they are struggling with is easy.

**D10** is the test to apply last, per paragraph, and it removes more than the
other nine combined.

A document that got shorter and still answers every question it did before got
better. Say what you deleted when you propose an edit: the deletion is the part
a reviewer will want to argue with, and hiding it in a diff is how it gets
reverted.
