# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist item rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the edition or version current when it was last read, and the
date of that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

Debugging has no standards body. Its base is two books, one paper and the tool
documentation, and this file says so rather than borrowing authority from
something adjacent.

## Books

| Short name     | Reference                                                                                                                                                           | Edition / version                                                                                                          | Checked    | Used for                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WPF            | Andreas Zeller, [_Why Programs Fail: A Guide to Systematic Debugging_](https://shop.elsevier.com/books/why-programs-fail/zeller/978-0-08-092300-0), Morgan Kaufmann | 2nd edition, 2009 (ISBN 978-0-12-374515-6)                                                                                 | 2026-09-24 | Defect, infection, failure and the infection chain (ch. 1); reproduction (ch. 3, 4); simplification (ch. 5); scientific debugging (ch. 6); ch. 8–16 below                                                                          |
| Agans          | David J. Agans, _Debugging: The 9 Indispensable Rules for Finding Even the Most Elusive Software and Hardware Problems_, AMACOM                                     | 1st edition, 2002 (ISBN 978-0-8144-7168-5; paperback 2006, ISBN 978-0-8144-7457-0)                                         | 2026-09-24 | The nine rules, cited by number: 2 make it fail, 3 quit thinking and look, 4 divide and conquer, 5 change one thing at a time, 6 keep an audit trail, 7 check the plug, 8 get a fresh view, 9 if you didn't fix it, it ain't fixed |
| Debugging Book | Andreas Zeller, [_The Debugging Book_](https://www.debuggingbook.org/), online, CC BY-NC-SA 4.0 text                                                                | Work in progress, no numbered release; front page "last change" 2024-07-01, "Introduction to Debugging" chapter 2024-10-15 | 2026-09-24 | Chapters "Introduction to Debugging" (the scientific method), "Reducing Failure-Inducing Inputs", "Isolating Failure-Inducing Changes", "Tracking Failure Origins"                                                                 |

WPF chapters cited in the checklists, by the second edition's numbering: 2
Tracking Problems, 3 Making Programs Fail, 4 Reproducing Problems, 5
Simplifying Problems, 6 Scientific Debugging, 8 Observing Facts, 9 Tracking
Origins, 12 Causes and Effects, 13 Isolating Failure Causes, 14 Isolating
Cause-Effect Chains, 15 Fixing the Defect, 16 Learning from Mistakes.

The Debugging Book is the free, executable successor material to WPF by the
same author. Its chapter on the cause-effect chain names the intermediate
states "faults" where WPF says "infections"; the checklists use WPF's term.

## Paper

| Short name | Reference                                                                                                                                                                                                   | Version                                                           | Checked    | Used for                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| DD 2002    | Andreas Zeller and Ralf Hildebrandt, [Simplifying and Isolating Failure-Inducing Input](https://www.st.cs.uni-saarland.de/publications/details/zeller-tse-2002/), IEEE Transactions on Software Engineering | Vol. 28, no. 2, pp. 183–200, February 2002; DOI 10.1109/32.988498 | 2026-09-24 | Delta debugging: `isolate.md` I1, I2; `root-cause.md` C6 — reducing a failing input to the part that matters |

## Tool documentation

| Short name | Reference                                                       | Version                          | Checked    | Used for                                                                                                                                        |
| ---------- | --------------------------------------------------------------- | -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| git-bisect | [git-bisect documentation](https://git-scm.com/docs/git-bisect) | Git 2.55.0 (released 2026-06-29) | 2026-09-24 | `isolate.md` I3–I5: `git bisect run` exit codes (`0` good, `1`–`127` except `125` bad, `125` skip, above `127` aborts), `skip`, `log`, `replay` |

## In this repository

| Source        | Used for                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------- |
| CLAUDE.md §5b | `reproduce-first.md` R6 and the refusal of production data or credentials in a reproduction |

## Deferred to elsewhere

- Production incidents, service-level objectives and postmortems:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- Test suite design, flakiness policy and CI signal:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- Severity and disclosure of a defect that is a vulnerability: the standards in
  [`docs/review-standards.md`](../../docs/review-standards.md), applied by
  [`security-reviewer`](../security-reviewer/SKILL.md).
