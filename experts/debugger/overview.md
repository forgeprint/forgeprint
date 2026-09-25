# Debugger

## What it changes

An agent handed a bug changes the most suspicious line, reruns, and reports
success when the symptom goes away. Nobody can tell afterwards whether it fixed
the cause, moved the symptom, or got lucky. Four things change with this
expert:

- **The reproduction is committed before the fix.** It is a test, or a script
  when a test cannot express it, and `git log` shows it landing first. The
  regression test is the same file, so "it fails on the fix commit's parent"
  is a checkout and a run, not a claim.
- **Isolation comes before explanation.** The failing input is shrunk until
  every remaining piece matters, a regression is bisected with a script, and
  the wrong state is traced back to where it first went wrong.
- **One hypothesis at a time, written down with what would refute it** —
  before the experiment runs, and with one change per experiment. Refuted
  hypotheses stay in the log.
- **A root cause is accepted only when it explains every symptom** and can be
  switched on and off. The analysis writes out the infection chain and says
  why the earlier checks missed it.

Five checklists — reproduce first, isolate, hypothesis log, root cause, fix and
regression test — and nine refusals, including a sleep or a retry as the fix
for a race.

## What it fits

- A bug whose cause is not obvious from the stack trace, or one that has been
  "fixed" before and came back.
- A regression — it used to work — where `git bisect run` turns a long history
  into a handful of test runs.
- A failure with a large input: a file, a request, a sequence of user actions,
  where delta debugging makes the cause readable.
- Any change an agent is about to make because "this might be it". The
  procedure turns that guess into an experiment with a recorded result.

## What it does not fit

- **A production incident in progress.** Restoring service, communication,
  service-level objectives and the postmortem belong to
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md) today; a
  site-reliability-engineer expert is planned. This method starts once the
  system is stable and somebody has to find out why.
- **Test suite design.** Layers, doubles, the flakiness policy and CI signal
  are [`qa-automation-lead`](../qa-automation-lead/SKILL.md)'s, and a
  test-engineer expert is planned. This expert leaves one regression test per
  bug; it does not decide what the suite should look like.
- **Performance regressions.** Bisecting still finds the commit, but profiling
  and load are a different discipline, planned as a performance-engineer
  expert.
- **Security vulnerabilities.** The method finds the defect; severity and
  disclosure go to [`security-reviewer`](../security-reviewer/SKILL.md) before
  the fix is described in public.
- **A failure nobody can reproduce.** The expert's honest output then is
  instrumentation and "not reproduced", and some teams will read that as doing
  nothing.

## Pros and cons

**In its favour:** almost everything it asks for leaves a trace a reviewer can
check without trusting the author — commit order, a failing checkout of the
parent, a bisect log, a hypotheses table whose refuting column was filled in.
The standard base is thin (two books, one paper, the git documentation), but
each check points at a specific rule or chapter, and the method has barely
changed since those were written.

**Against it:** it is slow on an easy bug. Reproducing, committing and logging
a one-line typo fix is ceremony, and the expert does not offer a shortcut. It
is also stack-neutral, so it names no debugger, no runner and no reduction
tool; somebody has to translate each check into their own tooling. And it is
`provenance: generated` — drafted from research, not from a practitioner's
habits — so read it with that in mind.
