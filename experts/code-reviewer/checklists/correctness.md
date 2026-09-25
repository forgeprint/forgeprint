# Correctness

The pass that finds bugs. For every hunk, try each question below as an input
you could hand the code. Where one produces a wrong result, that input is the
failure scenario and the row's CWE number goes in the comment.

CWE numbers are from CWE List 4.20. Rows marked **Top 25** are on the 2025 CWE
Top 25.

| #   | Check                                                                                           | How — the input to try                                                         | Source                                                                |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| C1  | Boundaries: empty, one element, the last index, the maximum                                     | walk every loop, slice and index with `[]`, `[x]` and the upper bound          | CWE-125 and CWE-787, out-of-bounds read and write (Top 25)            |
| C2  | Absent values: a value the new code dereferences can be null, missing or undefined on some path | trace each new dereference back to where the value is produced                 | CWE-476 NULL Pointer Dereference (Top 25)                             |
| C3  | Arithmetic: overflow, wraparound, division by zero, integer division where a fraction was meant | substitute zero, the type's maximum, and a negative                            | CWE-190 Integer Overflow or Wraparound; CWE-682 Incorrect Calculation |
| C4  | Every call that can fail has its failure handled or passed up; nothing is caught and ignored    | list the calls in the hunk that can throw or return an error; follow each      | CWE-754 Improper Check for Unusual or Exceptional Conditions          |
| C5  | Resources opened on a path are released on every path, including the error path                 | find each open, connection, lock or handle; find its close on the failure path | CWE-772 Missing Release of Resource after Effective Lifetime          |
| C6  | Shared state touched by more than one thread, request or process is synchronised                | ask what happens when two callers run this line at once                        | CWE-362 Race Condition; CWE-667 Improper Locking                      |
| C7  | Anything read from outside the process is checked before it is used                             | find where the new code reads a request, a file or a message                   | CWE-20 Improper Input Validation (Top 25)                             |
| C8  | Nothing grows without bound: loops, retries, queues, caches, result sets                        | ask what stops it; try a caller with a million rows                            | CWE-770 Allocation of Resources Without Limits or Throttling (Top 25) |
| C9  | The change keeps working for the callers it did not touch                                       | search for every caller of a changed signature or behaviour                    | Google Eng Practices — _What to look for_ ("Context")                 |
| C10 | A line you cannot understand is asked about, not skipped                                        | a `question:` comment on it                                                    | Google Eng Practices — _What to look for_ ("Every Line")              |

## Hand over, do not audit

These Top 25 classes are security findings. If a hunk shows one, raise it as
`issue (blocking)` with its CWE number and hand it to `security-reviewer`:
CWE-79 cross-site scripting, CWE-89 SQL injection, CWE-78 and CWE-77 command
injection, CWE-22 path traversal, CWE-862 and CWE-863 authorization, CWE-502
deserialisation, CWE-918 server-side request forgery.

## Why each one

**C2 and C4 are where most review-catchable bugs are.** Both live on the path
the author did not run: the lookup that found nothing, the call that failed.
Tests usually exercise the happy path, so the reviewer is often the only one
who walks the other one.

**C9** is the bug the diff cannot show. A changed return value is correct in
every line of the hunk and wrong in a file nobody opened. Searching for the
callers is the only way to see it.

**C10** is the honest one. A reviewer who skips what they do not understand
approves exactly the part most likely to be wrong, because code that is hard
to read is hard to write correctly too.
