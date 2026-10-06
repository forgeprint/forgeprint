# Scenario D — what six runs showed, and what they could not

Date: 2026-10-06. Protocol: [`docs/scenario-d.md`](../scenario-d.md).
Materials and the six filled records:
[`docs/scenario-d/`](../scenario-d/README.md).

**Two runs per configuration, which is the protocol's stated minimum and not a
strong base.** D3's two runs did not behave the same way as each other, so for
the configuration the experiment exists to judge, the sample is two
disagreeing points.

---

## The one-line answer

**[ADR 0014](../decisions/0014-crew-runtime-deferred.md) does not reopen on this
evidence.** Not because the expert did nothing — it changed behaviour markedly
and in the direction it claims — but because the thing ADR 0014 asks to see
could not occur: **no run split the work**, so there were no conflicts, no
rejected work and no worker marking its own work done.

What the round did produce is a sharper question and a better gate, and both are
recorded below.

## The runs

|                       | D1a    | D1b    | D2a    | D2b    | D3a          | D3b               |
| --------------------- | ------ | ------ | ------ | ------ | ------------ | ----------------- |
| Wall time             | 132 s  | 138 s  | 104 s  | 116 s  | 207 s        | 228 s             |
| Turns                 | 8      | 9      | 9      | 10     | 20           | 14                |
| Cost                  | $0.677 | $0.694 | $0.568 | $0.629 | **$1.369**   | **$1.244**        |
| Tokens out            | 15 817 | 15 999 | 12 017 | 14 130 | 22 046       | 18 606            |
| Checks passed         | 7/7    | 7/7    | 7/7    | 7/7    | 7/7          | 7/7               |
| **False completions** | 0      | 0      | 0      | 0      | 0            | 0                 |
| **Subagents spawned** | 0      | 0      | 0      | 0      | 0            | **1, a reviewer** |
| **Collisions**        | 0      | 0      | 0      | 0      | 0            | 0                 |
| **Rework**            | 0      | 0      | 0      | 0      | 0            | 0                 |
| Interventions         | —      | —      | —      | —      | 1, by policy | 0                 |
| Assumptions surfaced  | —      | —      | —      | —      | 4, asked     | 7, recorded       |
| Test assertions       | 94     | 71     | 49     | 73     | 75           | 68                |

Environment, identical across all six: headless `claude -p`,
`claude-opus-5-5`, `--strict-mcp-config`, one plugin (`forgelore@forgeprint`),
no hooks, no memory, the same frozen `ts-http-service` baseline
(`framework=hono`, 21 recipe steps verified), prompts read from the committed
files rather than retyped.

## Reading 1 — "D2 worse than D1": not answered

D2 exists to isolate what splitting does. **Neither D2 run split.** Neither
requested a subagent, so nothing was refused by a limit either; the permission
had no observable effect at all.

So the axis was never created. D2's numbers are better than D1's — faster,
cheaper, fewer output tokens, by more than the 5% the two baseline runs differed
by — and that comparison is between two D1-shaped runs whose prompts differed by
one sentence. It says nothing about splitting.

## Reading 2 — "D3 better than D2 on false completions, collisions or rework": no

All three are **zero in all six runs**, so D3 ties D2 at the floor. That is not
a tie on merit: collisions and rework have no opportunity in a run with no
workers, and no configuration produced a false completion because the
acceptance checks never failed after a run said it was done.

By the protocol's third reading — _"D3 no better than D2 means the expert is not
earning its place"_ — this is the outcome. The next section is why that sentence
is true and still not the whole picture.

## What the expert did do, at roughly double the cost

|              |                                                                        |
| ------------ | ---------------------------------------------------------------------- |
| Cost         | $1.24–1.37 against a baseline of $0.68–0.69                            |
| Both D3 runs | decided **not** to split, and said why                                 |
| D3a          | stopped and asked four decisions before writing code                   |
| D3b          | recorded seven assumptions and proceeded; spawned a read-only reviewer |

D3b's quantified refusal to split is the clearest single sentence the round
produced:

> Single agent, no subagents: width is 2 after T1, the parallel part is ~150
> lines, and spawning workers that each re-read the codebase costs more than the
> work.

### The reviewer found what the gate cannot

D3b's one subagent was an independent read-only reviewer. It found three
defects, fixed two, and recorded the third as open:

- `done: null` accepted where a boolean was required — fixed, test added
- an unknown key echoed back in an error message — fixed
- no content-type check — **not fixed, recorded as open**

**None of the five acceptance checks asks about any of these.** They ask whether
the build builds, whether tests pass, whether a route escaped its token, whether
a malformed body answers 500. The reviewer worked below the gate's resolution.

This is the mechanism ADR 0014 names, observed once. It is also exactly the
condition the ADR attaches to it: _"if the failures that remain are ones a
deterministic check would have caught, the checks are worth writing — and only
those."_ Two of the three are:

- a boolean field accepting `null`;
- an error response echoing an unvalidated key back to the caller.

Both are deterministic. Neither needs a runtime, a workspace or a crew command.
**That is the actionable result of this round**, and it argues for two
`lint-setup`-shaped checks rather than for the thing ADR 0014 deferred.

## What the round broke, and what that cost

**The gate passed a run that implemented nothing.** D3a's first turn wrote a
plan, asked four questions and touched no code; `checks.sh` reported 5 of 5,
because every assertion in it asked whether something had got worse and all of
them hold on an untouched project. The protocol's check 1 asks for "at least one
test per route and per refusal" and the count had been written as a `note`
rather than an assertion.

`check 0` and `check 1c` now carry that floor, verified in both directions. The
four records written before the fix were re-checked and updated from 5 of 5 to
7 of 7; no verdict moved. `check5.mjs` had already caught the case on its own.

**Headless removed two of the eight measures.** Interventions and assumptions
surfaced are unmeasurable when the agent cannot ask — and assumptions surfaced
is the one measure the expert is built to move. D3a could only be read because
it stopped, which is the behaviour headlessness blocks. `--bare`, which is what
the protocol's "clean session" asks for, had to be dropped because it also drops
authentication.

**The answer policy is an intervention by construction.** D3a needed a reply to
finish, so [`reply.md`](../scenario-d/reply.md) fixed one — written and
committed before use, fired by a mechanical condition, identical for all six
runs and never triggered for a run that finished. It is recorded as "1, by
policy" rather than as a measurement.

## Two things the baseline showed that nobody asked about

**The same task, six designs.** Deleting a project that still has tasks: three
runs cascaded, three refused. All six were internally consistent and all six
passed check 3. Nothing in the task said which was wanted, and only the two D3
runs raised it as a decision rather than settling it silently — D3a by asking,
D3b by writing the reason at the line of code.

That is the collision D3's principles exist to prevent, demonstrated by the
configurations that have no principles, in a setting where it cost nothing
because there was only one agent. It is the strongest argument in this report
for a wider task in the next round.

**Thoroughness is noise.** Assertion counts across six runs of the same task:
94, 71, 49, 73, 75, 68. No relation to configuration. An earlier record called
the first three a falling trend; the fourth answered that, and the paragraph was
corrected rather than removed.

## What a second round should change

1. **A task wide enough that splitting is the cheaper option.** Two resources
   sharing one relationship were not. D3b measured the width at 2 and ~150
   lines and declined on arithmetic. Three or four independent resources, or a
   second interface, would make the choice live.
2. **A gate with finer resolution,** starting with the two deterministic checks
   D3b's reviewer found — and only those, per ADR 0014.
3. **An interactive or policy-fixed reply from the first run,** so that
   assumptions surfaced and interventions are measurable in every
   configuration rather than in one.

## Verdict

- ADR 0014 stays deferred. The evidence it names did not appear, and could not
  have in these runs.
- The `technical-program-manager` expert changed behaviour in the direction it
  claims and cost roughly twice as much to do it. On the protocol's measures it
  is not better; on the one thing that is not a protocol measure — independent
  review finding real defects — it is, once.
- Its [overview](../../experts/technical-program-manager/overview.md) now says
  this, with the cost, rather than waiting for a run that flatters it.
