# Intent and scope

Run this before reading a single hunk closely. A diff can only be judged
against what it claims to do, and a diff that claims several things cannot be
judged at all.

| #   | Check                                                                                                     | How                                                                      | Source                                                                          |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| S1  | The change states what it does and why, in the author's words                                             | read the description and the linked issue; quote the sentence            | Google Eng Practices — _Writing good CL descriptions_                           |
| S2  | Every file in the diff serves the stated intent                                                           | `git diff --stat <base>...<head>`; for each file, name the part it plays | Google Eng Practices — _Small CLs_ ("What is Small?")                           |
| S3  | Refactoring and behaviour change are in separate changes, or the description says they are mixed          | look for moved or renamed code next to new logic                         | Google Eng Practices — _Small CLs_ ("Separate Out Refactorings")                |
| S4  | The size is recorded, and above about 400 changed lines a split is requested or the review is design-only | count added and deleted lines, excluding generated files                 | SmartBear, _Best Practices for Code Review_ (Cisco study); Google — _Small CLs_ |
| S5  | Generated files, lockfiles and snapshots are listed as excluded, not silently skipped                     | name them in the review record                                           | Google Eng Practices — _What to look for_ ("Exceptions")                        |
| S6  | The change builds and its tests pass on the head commit, run by the reviewer                              | check out the head; run the build and the test command                   | Google Eng Practices — _What to look for_ ("Functionality")                     |
| S7  | A design that does not fit is raised before any line comment                                              | after the broad pass, before step 5 of the procedure                     | Google Eng Practices — _Navigating a CL in review_                              |

## Why each one

**S1 is the one everything else depends on.** Without a stated intent the
reviewer invents one, reviews against it, and the author spends the thread
explaining what they meant. One `question:` asking for the intent is cheaper
than a review of the wrong thing.

**S3** catches the most common place a bug hides in review: a function is moved
and, in the same diff, one condition in it changes. The diff shows two hundred
moved lines and the reader's eye slides past the one that matters.

**S4** is a number because "too big" is an argument and 400 is not. The figure
comes from the SmartBear study of a Cisco team, where the defect-finding rate
fell off above 200 to 400 lines per review; Google's guide says 100 lines is
usually reasonable and 1,000 usually too large. Either way, the size goes in
the record, so the reader knows how much attention each line could have had.
