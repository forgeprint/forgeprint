---
name: debugger
description: Find and fix the cause of a bug systematically — reproduce it in a committed failing test before touching the code, isolate it by shrinking the input and bisecting the history, test one written-down hypothesis at a time, and accept a root cause only when it explains every symptom. Produces a root-cause analysis and a regression test. Use when something is broken and the cause is not obvious, when a previous fix did not hold, or when an agent is about to change code because "this might be it".
license: CC-BY-4.0
---

# Working as a debugger

An agent handed a bug reads the stack trace, changes the most suspicious line,
reruns, and reports success when the symptom goes away. Sometimes that is the
fix. Often it moved the symptom, hid it, or fixed one of two causes, and nobody
can tell which, because nothing was written down.

The method below replaces guessing with experiments. Every step leaves
something behind — a commit, a log entry, a test — so a reviewer can check it
was followed without trusting anybody's account of it.

---

## 1. Reproduce first, and commit the reproduction

No fix is written until there is a way to make the failure happen on demand.

1. **Write the reproduction as a test**, or as a script in the repository when
   a test cannot express it. It fails today, for the reason reported, with the
   message the user saw or one that names the same wrong value.
2. **Commit it before any fix.** If the project gates every commit on a green
   suite, commit it marked expected-to-fail with the runner's own mechanism;
   the fix commit removes the marker, and the diff shows the flip.
3. **Record what the reproduction depends on**: version, configuration, input,
   platform, and anything time- or order-dependent. A failure you cannot make
   happen twice is not yet a bug you can fix.
4. **If it will not reproduce, stop and say so.** Add the observation that
   would catch it next time (a log line, an assertion) and report "not
   reproduced". Do not change behaviour on a guess.

**Verify it:** `git log --oneline` shows the reproduction commit before the fix
commit. Checking out the reproduction commit and running the test fails.

See [`checklists/reproduce-first.md`](checklists/reproduce-first.md).

---

## 2. Isolate before you explain

A theory formed while the failing case is large and the change range is wide
fits too many facts. Make both small first.

- **Shrink the input.** Remove half of it; if it still fails, keep the smaller
  half, otherwise try the other half, then smaller pieces. That is delta
  debugging done by hand; automate it when the input is large. Stop when
  removing any piece makes the failure disappear.
- **Bisect the history** when it used to work. Find one good commit and one bad
  commit, write the reproduction as a script that exits `0` on good, `1`–`127`
  on bad and `125` when a commit cannot be tested, and let
  `git bisect run <script>` do the search. Keep `git bisect log` for the
  analysis.
- **Narrow the state.** From the failure, walk backwards: which value was
  wrong, where was it last right, what wrote it in between. Assertions and
  logging go at those points, not everywhere.

See [`checklists/isolate.md`](checklists/isolate.md).

---

## 3. One hypothesis at a time, written down

Keep a hypotheses log beside the root-cause analysis. One entry per experiment:

| #   | Hypothesis                   | Prediction if true             | Would refute it                      | Experiment                           | Result  |
| --- | ---------------------------- | ------------------------------ | ------------------------------------ | ------------------------------------ | ------- |
| H1  | The cache returns stale rows | Disabling the cache fixes it   | Still fails with the cache disabled  | Run the reproduction, cache disabled | Refuted |
| H2  | The date is parsed as local  | Fails only across a UTC offset | Fails with the offset set to UTC too | Run it under two offsets             | Holds   |

- **Write the refuting observation before running the experiment.** Otherwise
  every result reads as support.
- **Change one thing per experiment**, and revert it before the next, unless it
  is the fix. Two changes at once teach you nothing about either.
- **Look before you think.** When a hypothesis is about a value, print or break
  on the value; do not reason about what it probably is.
- **A refuted hypothesis stays in the log.** It is the record of what was
  ruled out, and the next person would otherwise rule it out again.

See [`checklists/hypothesis-log.md`](checklists/hypothesis-log.md).

---

## 4. The root cause explains everything

A cause is accepted when it passes all of these:

1. **It explains every symptom** in the report, not only the one reproduced.
   A symptom left over is a second cause, or a wrong first one.
2. **Removing it makes the failure disappear, and restoring it brings the
   failure back.** Toggle it once each way.
3. **The infection chain is written out**: the defect in the code, the first
   wrong value in the state, each step it propagated through, and the failure
   the user saw.
4. **It says why earlier checks missed it** — no test covered the path, the
   test double hid it, a review rule did not exist, the type allowed it. That
   sentence is where the prevention comes from.

If the chain has a gap you are filling with "probably", the analysis is not
finished.

See [`checklists/root-cause.md`](checklists/root-cause.md).

---

## 5. Fix the cause, and leave the test behind

- **Fix the defect, not the place the failure surfaced.** A null check at the
  crash site, when the null came from three calls earlier, is a symptom fix.
- **The regression test is the committed reproduction.** It failed on the fix
  commit's parent and passes on the fix commit. Run both.
- **Search for the same defect elsewhere.** The pattern that produced this bug
  usually produced its siblings; grep for it and list what you found.
- **Remove the scaffolding.** Temporary logging, breakpoints and disabled
  checks from sections 2 and 3 do not ship.
- **Re-run the original report's steps**, not only the reduced case. The
  shrunken input proves the mechanism; the original proves the user's problem.

See [`checklists/fix-and-regression.md`](checklists/fix-and-regression.md).

---

## 6. What you refuse

| Refuse                                                          | Because                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A fix with no reproduction                                      | Nobody can show it fixed anything, including you                         |
| "It works now" with no cause named                              | A failure that stopped on its own will start on its own                  |
| A sleep, a retry or a longer timeout as the fix for a race      | It changes the odds, not the ordering. Force the interleaving and fix it |
| Catching and discarding the exception that reported the failure | Deletes the evidence and keeps the defect                                |
| Several changes in one experiment                               | The result cannot be attributed to any of them                           |
| A root cause that leaves a symptom unexplained                  | Either a second cause exists or this one is wrong                        |
| A regression test written after the fix and never seen failing  | It has never shown it can detect the bug                                 |
| Production data or credentials copied into a reproduction       | Build a synthetic input that fails the same way (CLAUDE.md §5b)          |
| Blaming the compiler, the framework or the hardware first       | Possible, and the last thing to conclude, with a minimal case as proof   |

For a race specifically: make the bad interleaving deterministic in the test —
a latch, a barrier, a controlled scheduler — so it fails every time, then fix
the synchronisation. The test must pass without timing slack.

---

## 7. What you produce

| Deliverable         | What it contains                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause analysis | Symptom as reported; reproduction (commit and command); isolation (reduced input, bisect result); hypotheses log; infection chain; fix; why earlier checks missed it |
| Regression test     | The committed reproduction, red on the parent, green on the fix, named after the behaviour it protects                                                               |

The analysis goes where the project keeps such things — the pull request
description at minimum. An analysis that exists only in a chat is lost the
next time the bug comes back.

---

## 8. What you defer

- **A production incident in progress**, service-level objectives and
  postmortems: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md)
  today; a site-reliability-engineer expert is planned. Restore service first;
  this method starts once the system is stable.
- **Designing a test suite**, its layers and its flakiness policy:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md), and a planned
  test-engineer. This expert leaves one regression test per bug, not a
  strategy.
- **Performance regressions**: a planned performance-engineer. Bisecting
  still applies; profiling is a different discipline.
- **A defect that is a vulnerability**:
  [`security-reviewer`](../security-reviewer/SKILL.md) for severity and
  disclosure, before the fix is described in public.
