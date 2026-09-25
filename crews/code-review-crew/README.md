# Code Review Crew

_Assembled by @aliosmanmho_

Four reviewers for one pull request, one lens each, ending in one finding list
and one verdict. This is the shape the Claude Code agent-teams documentation
uses as its own review example, and the one the crews research found shipped
most widely: parallel review by lens, merged by a lead.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                | Its lens                                                            | The question it asks first                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| [`code-reviewer`](../../experts/code-reviewer/SKILL.md)               | Correctness and maintainability against the change's stated intent  | Which input produces the wrong result, and what result |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)       | Trust boundaries, then authorization, each finding citing a control | Which new path crosses a boundary without a check      |
| [`performance-engineer`](../../experts/performance-engineer/SKILL.md) | Measured cost of the change on a hot path                           | Did anything move by more than the run-to-run spread   |
| [`test-engineer`](../../experts/test-engineer/SKILL.md)               | The tests inside the change, and whether they would notice a bug    | Which mutant of the changed lines survives the suite   |

**All four are checkers; the code reviewer is the one that merges.** It reads
the whole diff against its intent first, and at the end it folds the other
three lenses into one list with one verdict. A finding that names no input and
no wrong result is dropped, whichever lens raised it.

There is no architecture lens. In this catalog an architect is per language
([ADR 0015](../../docs/decisions/0015-experts-per-language.md)); if the change
moves a boundary, add the architect for your stack.

## What they install

| Integration                                             | Why this crew wants it                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`github-mcp`](../../integrations/github-mcp/README.md) | The diff, its checks and the review comments live in the pull request, and every lens reads the same one |

Third-party software with real permissions: the token reaches, and can write
to, every repository it can see. Read its README first, and give review a token
that cannot push.

## The order they are useful in

1. **Code reviewer first**, on the whole diff: what the change says it does,
   whether it does that, and whether it runs. If the intent is unclear, the
   review stops here and asks — the other lenses would be reviewing a guess.
2. **Security reviewer and performance engineer next**, and these two can run
   side by side: they read different things and write to no shared file. The
   performance engineer only measures when the diff touches a path somebody
   has shown to be hot; otherwise its answer is "not in scope", which is an
   answer.
3. **Test engineer third**, on the tests in the change, once the first three
   have said what a bug would look like. It mutates the changed lines and
   reports the survivors.
4. **Code reviewer last**, merging: one list, duplicates removed, each finding
   with its file and line, and one verdict.

They disagree in two places, and the disagreement is useful:

- The performance engineer's faster version is often harder to read. The code
  reviewer does not accept the trade unless the measurement beats the spread;
  a speed-up nobody measured is a maintainability cost with no benefit.
- The test engineer asks for a failing test behind every finding; some security
  findings live in configuration no unit test reaches. Those stay as findings
  with a reproduction, and the missing test is named rather than faked.

## Why four, and no more

- Review is where the multi-agent evidence is strongest. Lenses read the same
  diff but write nothing shared, which is the breadth-first work Anthropic's
  research system measured as helped, not the coupled work it measured as hurt.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification and
  sharper role specifications worth +9.4%. Four lenses that do not overlap, and
  one member that merges, is that finding applied.
- Kim et al. measured errors amplified 17.2 times across independent agents and
  4.4 times with a coordinator. The merge step is the coordinator; without it,
  four reviews are four opinions.

## Where this crew is wrong

- **Writing the code.** This crew reads. Take the expert whose area the change
  is in.
- **Style-only linting.** A formatter and a linter do that deterministically.
- **A diff of a few lines, or one file.** One reviewer reads it faster than
  four can hand it round. Take the code reviewer alone.

## How to use it

Ask your agent for the crew by name on a pull request, run the code reviewer
first, and do not start the other lenses until the intent of the change is
written down.
