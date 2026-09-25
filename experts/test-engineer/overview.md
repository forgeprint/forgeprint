# Test Engineer

## What it changes

An agent asked to implement something writes the code, then writes tests that
pass against it. Those tests have never failed, their cases are whatever came
to mind, and nobody knows whether they would notice the code changing. Four
things change with this expert:

- **Every test is seen failing first.** Red, green, refactor, one test-list
  item at a time, with the failure line kept as evidence that the test can
  detect what it claims to.
- **Cases are derived, not guessed.** Equivalence partitions, three-value
  boundaries, decision tables and state transitions, from the ISTQB Foundation
  syllabus and ISO/IEC/IEEE 29119-4. Each test names the partition or boundary
  it covers, so a reviewer can see what was skipped.
- **Doubles are called what they are.** A stub is not a mock; a query is
  stubbed and its result asserted, a call is verified only when the call is the
  outcome, and every fake has a contract test against the real implementation.
- **The assertions are measured.** A mutation tool runs on the changed files,
  and every surviving mutant gets a written outcome: a new test, an argued
  equivalence, or a reasoned acceptance.

A bug fix starts with a test that reproduces it and fails on the parent commit.

Five checklists — red-green-refactor, test design techniques, test doubles,
regression first, mutation analysis — and ten refusals.

## The boundary with `qa-automation-lead`

Both are quality experts, and they are deliberately cut apart.
[`qa-automation-lead`](../qa-automation-lead/SKILL.md) looks at the suite as a
system: its strategy and layer mix, end-to-end journeys, how the pipeline
signals, what happens to an unstable test, and the release gate. This expert
works inside one change: the next test, the cases it needs, the doubles it
uses, and whether its assertions bite.

Use both on a project, not one instead of the other. When they meet — a unit
test that is unstable in the pipeline, a bug found by an end-to-end test — the
lead owns the policy and this expert writes the lower-level test.

## What it fits

- Implementing a function, class or module test-first.
- Fixing a bug, where the reproducing test is the deliverable that proves it.
- Adding tests to a module that has few, by deriving cases rather than
  covering lines.
- Reviewing the tests in a pull request: were they seen failing, where did the
  cases come from, are the doubles honest, were the survivors triaged.

## What it does not fit

- **Test strategy, end-to-end tests and the release gate.** Those belong to
  `qa-automation-lead`, and this expert will hand the question over.
- **A bug nobody can reproduce yet.** Root-cause analysis is a different method;
  this expert starts once there is a reproduction to write down.
- **Code with no seams.** If the unit cannot be constructed without the
  database, the network and the clock, the first finding is structural and it
  goes to an architect.
- **Performance, load, security and accessibility testing.** Each has its own
  criteria; security belongs with
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Exploratory and manual testing.** Everything here ends in an automated test.

## Pros and cons

**In its favour:** every rule leaves evidence — a recorded failing run, a test
name that maps to a partition, a contract test next to each fake, a mutation
report with a triage line per survivor. A reviewer does not have to trust that
the method was followed; the artefacts show it.

**Against it:** it is slower per change than writing tests after the code, and
mutation runs cost minutes that a quick fix will resent. The test-first rule
also depends on a record of the failing run, which some workflows do not keep.
It is stack-neutral, so it names mutation tools only for the stacks Stryker and
PIT cover, and a reader on another stack has to find their own.
