---
name: code-reviewer
description: Review a change (a pull request, a diff, a commit range) for correctness and maintainability. Reads the whole diff against the intent the author stated, runs it, looks for bugs before style, requires a test for every behaviour change, and writes each finding with its file, its line and the input that makes it go wrong. Use when asked to review a pull request or a diff, before merging somebody else's change, or when an agent is about to approve something it has only skimmed.
license: CC-BY-4.0
---

# Reviewing a change

A review answers one question: **is the codebase better with this change than
without it?** Not "is it perfect". A change that clearly improves the code
should be approved even if the reviewer would have written it differently
(Google, _The Standard of Code Review_).

What turns an opinion into a review is evidence. Every finding here names a
place and a failure, and the review records what the reviewer read and ran, so
somebody else can check that the approval was earned.

---

## 1. The review record

Every review begins with this block. It is how you, and anyone reading after
you, can confirm the procedure was followed.

```
Change:  <base>..<head>  <N> files, +<added> -<deleted> lines
         (excluded as generated: <lockfiles, snapshots, vendored code, or "none">)
Intent:  "<the author's own sentence from the description or linked issue>"
Read:    <N> of <N> files, every hunk
Ran:     <command>  -> <result>
         <command>  -> <result>
```

- The line counts come from `git diff --stat <base>...<head>`, not from an
  estimate.
- `Read` must equal the file count. If it does not, the review says which files
  were not read and why, and it cannot approve (§6).
- `Ran` lists the build and the tests you executed on the head commit. "Not
  run" is allowed only with the reason, and it rules out approval.

---

## 2. The procedure, in order

1. **Establish the intent.** Quote what the change says it does. A change with
   no stated intent gets one blocking `question:` and nothing else: without
   the intent there is nothing to review the diff against.
2. **Measure the size.** Over roughly 400 changed lines, excluding generated
   files, the defect-finding rate drops (SmartBear/Cisco study; Google puts
   "usually too large" at 1,000). Ask for a split. If splitting is impossible,
   review the design only and say so in the record.
3. **Run it.** Check out the head commit, build it, run the tests. A failing
   build is the first finding and the review can stop there.
4. **Take the broad view first.** Does the diff do what the intent says, and
   nothing else? Unrelated edits, a refactor mixed into a behaviour change, or
   a design that does not fit are raised **now**, before line comments,
   because they make line comments wasted work (Google, _Navigating a CL_).
5. **Correctness, every line.** Walk each hunk with
   [`checklists/correctness.md`](checklists/correctness.md). Read the
   surrounding code too: most bugs live where the new lines meet the old ones.
6. **Tests.** For every behaviour the change adds or alters, find the test that
   pins it, and confirm it would fail without the change
   ([`checklists/tests-in-the-change.md`](checklists/tests-in-the-change.md)).
7. **Maintainability.** Complexity, names, comments, dead code, documentation
   ([`checklists/maintainability.md`](checklists/maintainability.md)).
8. **Style last, and only what no formatter or linter already enforces.**
   Always labelled non-blocking.
9. **Write the review** as in §4, and choose the verdict as in §6.

Order matters. A reviewer who starts with naming will spend the attention on
naming, and the off-by-one ships.

---

## 3. A finding needs a failure scenario

> **Before you write a finding, write the input that breaks it.**

```
<file>:<line>  issue (blocking): <one-line summary>
  Scenario: <input or state>  ->  expected <X>, gets <Y>
  Why:      <the rule or reasoning, with its source>
  Fix:      <direction, not necessarily code>
```

Example: `orders/total.ts:42  issue (blocking): an empty cart returns NaN` —
Scenario: `items = []` -> expected `0`, gets `NaN` (division by `items.length`).

If you suspect a bug but cannot write the scenario, it is not a finding yet. It
is a `question:` — ask it, non-blocking, and let the author answer. Guessing at
a bug with no scenario costs the author an afternoon disproving it.

Where the failure is a known weakness class, cite it by number from the CWE
list — `CWE-476 NULL Pointer Dereference`, `CWE-190 Integer Overflow`. The
number tells the author exactly which class of mistake is meant.

---

## 4. Writing the comments

Every comment carries a **Conventional Comments** label and, where it is not
obvious, a decoration:

| Label              | Meaning here                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `issue (blocking)` | A failure scenario exists. Must be resolved before approval      |
| `issue`            | A real problem the author may reasonably defer, with an issue    |
| `question`         | You suspect something and cannot yet write the scenario          |
| `suggestion`       | A better way, with the reason; the author decides                |
| `nitpick`          | Style or taste. Always non-blocking                              |
| `praise`           | Something done well, named specifically. At least one per review |
| `todo`             | A small, necessary change: a missing changelog line, a stale doc |

Rules for the text:

- Comment on the code, never on the author.
- Say why. A request without its reason is an order, and orders get argued.
- Point at the problem; propose a direction; leave the solution to the author
  unless it is one line.
- Blocking is decided by the scenario, not by how strongly you feel. Personal
  preference that no style guide or source backs is at most a `nitpick`
  (Google: technical facts and data overrule opinions).

---

## 5. What you refuse

| Refuse                                                     | Because                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Approving a change you did not build and run               | An approval is a claim that it works; you have no evidence it does |
| Approving with files unread                                | The unread file is where the reviewer's name is being borrowed     |
| A blocking comment with no failure scenario                | The author cannot fix what cannot be reproduced                    |
| Style comments before the correctness pass is finished     | Attention spent on names is attention not spent on the bug         |
| A behaviour change with no test                            | Nothing stops the next change from undoing it                      |
| A refactor and a behaviour change in one diff, unannounced | The behaviour change hides inside the moved lines                  |
| "LGTM" with no record                                      | Nobody can tell a read from a glance                               |
| Reviewing part of a change and presenting it as the whole  | Say which files you covered; somebody else may think they are done |
| Blocking on a preference no style guide states             | It is taste, and the author's taste counts as much as yours        |

---

## 6. The verdict

Exactly one:

| Verdict                 | When                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `approve`               | Record complete, no blocking comment open, and the change improves the code        |
| `approve-with-comments` | As above, and the open comments are non-blocking ones the author can settle alone  |
| `changes-requested`     | At least one `issue (blocking)` or `todo` open                                     |
| `cannot-approve`        | Something in the record is missing: not run, not all read, no intent, or too large |

`cannot-approve` is not a rejection. It says what the reviewer could not do
and what would let them finish: a way to run it, a split, a description.

Respond within one business day, even if the response is only the broad-view
comment. Fast first responses matter more than a fast whole review (Google,
_Speed of Code Reviews_).

---

## 7. What you produce

| Deliverable      | What it is                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code review      | The record (§1), comments in the §3 and §4 format ordered by severity then file, a verdict (§6), and what was checked and sound                                   |
| Refactoring plan | When a review finds structure that should change but not in this diff: a sequence of small, behaviour-preserving steps, each its own change with its own test run |

A refactoring plan is how a reviewer says "not in this change" without losing
the point. Each step is small enough to review in one sitting, and no step
changes behaviour (Fowler's definition of a refactoring).

---

## 8. What you hand over

A code review sees a little of everything. Name the boundary and hand the rest
to the expert that owns it.

- **Security in depth** goes to
  [`security-reviewer`](../security-reviewer/SKILL.md). If a hunk looks like
  injection, missing authorization, or a secret, raise it with its CWE number
  as `issue (blocking)` and hand it over. Do not audit the trust boundaries
  yourself.
- **Test strategy and the health of the suite** — flakiness, layers, what to
  fake — go to [`qa-automation-lead`](../qa-automation-lead/SKILL.md). This
  expert only asks whether _this change_ carries tests for what it changes.
- **Writing the tests** is `test-engineer`'s job, a role with no expert
  in the catalog yet. The reviewer names the missing test; it does not write it.
- **Architecture** — service boundaries, layering, a design that spans many
  changes — goes to an architect. For .NET that is
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md).

The standards behind every rule are in [`references.md`](references.md).
