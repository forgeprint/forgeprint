# Legacy Modernization Crew

_Assembled by @aliosmanmho_

Four experts for moving a legacy codebase somewhere new without losing what it
does: the business rules written down and traced to the code, the current
behaviour pinned by tests that are proved to bite, one slice moved at a time
behind a seam, and the security checks carried across rather than left behind.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                    | What it brings                                                                  | The question it asks first                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`business-analyst`](../../experts/business-analyst/SKILL.md)             | The rules the code implements, each sourced and traced both ways                | Which rule is this line enforcing, and who said so                  |
| [`modernization-engineer`](../../experts/modernization-engineer/SKILL.md) | Characterization tests, a seam, one slice at a time, one major version per step | What does the old code do today, exactly, including the wrong parts |
| [`test-engineer`](../../experts/test-engineer/SKILL.md)                   | Mutation analysis on the pinning suite before a slice moves                     | Which change to the old code would the pinning tests miss           |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)           | Trust boundaries and authorization on each moved slice                          | Which check did the old path make that the new one does not         |

**Two checkers.** The test engineer checks the modernization engineer's
pinning suite — a characterization test that survives its mutants pins
nothing. The security reviewer checks each moved slice, because authorization
is the check a migration loses most quietly.

There is no architect. In this catalog an architect is per language
([ADR 0015](../../docs/decisions/0015-experts-per-language.md)); add the one
for the target stack when the migration changes the architecture as well as
the language.

## What they install

| Integration                                                 | Why this crew wants it                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`github-mcp`](../../integrations/github-mcp/README.md)     | One pull request per slice, with the pinning tests and the review on it              |
| [`context7-mcp`](../../integrations/context7-mcp/README.md) | Documentation for both the old and the new versions, at the versions actually in use |
| [`serena-mcp`](../../integrations/serena-mcp/README.md)     | Symbol-level navigation and edits in a codebase too large to read file by file       |

All three are third-party software. Serena edits code in the project it starts
in; the GitHub token reaches every repository it can see. Read each README
first, and run Serena on a branch.

## The order they are useful in

1. **Business analyst first**, on the slice about to move: its rules, each
   with a source and a trace to the code, and the assumptions owned and dated.
2. **Modernization engineer second**: characterization tests that pin today's
   behaviour, then the seam.
3. **Test engineer third**, before anything moves: mutation analysis on the
   pinning tests. Surviving mutants mean more tests, not a move.
4. **Modernization engineer again**, moving the slice behind the seam and
   showing parity.
5. **Security reviewer last** on each slice, then back to step 1 for the next.

They disagree in two places, and the disagreement is useful:

- The business analyst finds a rule the old code implements wrongly; the
  modernization engineer pins it as it is. Both are right. Pin it, move it
  with parity, then fix it as a separate change with its own requirement —
  never inside the move.
- The security reviewer wants an insecure legacy behaviour gone; parity says
  keep it. Security wins, as its own recorded change, so that a parity failure
  is never mistaken for a fix.

## Why four, and one slice at a time

- Kim et al. measured sequential planning getting 39% to 70% worse with more
  agents. A migration is a sequence of slices, so the members work one slice
  at a time, in order, not side by side on different slices.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification
  and a verification step worth +15.6%. Mutation analysis on the pinning suite
  is the verification a migration most often skips.

## Where this crew is wrong

- **Greenfield work.** There is nothing to pin.
- **A routine version bump.** One major version, a changelog, a test run: the
  modernization engineer alone.
- **A change confined to one module.** Small and sequential; four experts only
  relay it.

## How to use it

Ask your agent for the crew by name, choose the first slice, and do not move it
until the test engineer has reported the surviving mutants.
