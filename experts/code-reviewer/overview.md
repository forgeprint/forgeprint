# Code Reviewer

## What it changes

An agent asked to review a pull request skims it, leaves a handful of comments
about naming, and approves. It has not run the code, it may not have opened
every file, and nothing in its review says so. Four things change with this
expert:

- **A review record comes first.** The diff's size, the author's stated
  intent quoted back, how many files were read out of how many, and which
  commands were run with what result. An approval with a gap in the record is
  not available: the verdict is `cannot-approve`, with what would fix it.
- **Every blocking finding names a failure.** `file:line`, the input, the
  expected result and the actual one. A suspicion with no scenario is asked as
  a `question:`, not asserted as a bug.
- **Bugs before style.** The passes run in a fixed order — intent, size, run
  it, broad view, correctness, tests, maintainability, style — and style is
  always non-blocking.
- **A behaviour change without a test is a blocking finding**, and the new test
  has to fail against the old code, not only pass against the new.

Five checklists: intent and scope, correctness, tests in the change,
maintainability, and comments and verdict. The correctness checklist cites CWE
entry numbers so a finding names its class exactly.

## What it fits

- Reviewing a pull request, a diff or a commit range written by a person or by
  another agent.
- A change where the reviewer can check out the code and run it. This expert
  is at its best there, and says plainly when it could not.
- Teams that want review comments sorted by what must be done, using
  Conventional Comments labels.
- Deciding that a structural problem belongs in a later change: the
  refactoring plan is how it is said without blocking the one in front of it.

## What it does not fit

- **Security audits.** It recognises an injection, an authorization gap or a
  secret in a hunk, raises it as blocking with a CWE number, and hands it to
  [`security-reviewer`](../security-reviewer/SKILL.md). It does not map trust
  boundaries or review a threat model.
- **Test strategy.** Whether the suite is flaky, which layer a test belongs in,
  what to fake — [`qa-automation-lead`](../qa-automation-lead/SKILL.md). This
  expert only asks whether this change carries tests for what it changes.
- **Writing the missing tests.** It names them; writing them is the
  `test-engineer` role, which has no expert in the catalog yet.
- **Architecture.** A design that spans services or many changes belongs to an
  architect — [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET. It will say a design does not fit this change; it will not redesign
  the system.
- **Changes it cannot run.** A diff pasted without a repository, or code that
  needs infrastructure the reviewer does not have, can be read and commented
  on, but the verdict is `cannot-approve`. That is deliberate.
- **Very large changes.** Above roughly 400 changed lines it asks for a split
  or reviews the design only, and says which.

## Pros and cons

**In its favour:** almost every rule leaves a trace somebody else can check.
The record states what was read and run; the comments carry labels and
scenarios; the verdict follows from a table. A reader can audit the review
without redoing it, which is the point of writing one down.

**Against it:** it is slower than a skim, and it refuses the fastest outcome —
approving what looks fine. On a one-line typo fix the record is overhead. It
is also stack-neutral, so it names no linter, no test runner and no language
rule; translating "run it" into a command is the reader's job. And it is
`provenance: generated`: written from the sources in `references.md` and the
2026-09-24 role research, not from a person's review practice, and it has not
yet been measured on real pull requests.
