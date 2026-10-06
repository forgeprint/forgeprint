# Scenario D, round 2 — the materials

The protocol is [docs/scenario-d.md](../../scenario-d.md); round 1's materials
are [one directory up](../README.md) and stay where the
[report](../../research/2026-10-06-scenario-d.md) and its six records link
them. This folder is round 2, and it exists **before the first run**, because a
check written after watching a run is a check that run passes.

| File                             | What it is                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------- |
| [`prompt-d1.md`](prompt-d1.md)   | the baseline prompt, pasted unchanged                                        |
| [`prompt-d2.md`](prompt-d2.md)   | D1 plus one sentence allowing subagents                                      |
| [`prompt-d3.md`](prompt-d3.md)   | D2 with the `technical-program-manager` expert named                         |
| [`checks.sh`](checks.sh)         | the acceptance checks a shell can hold honestly                              |
| [`check-app.mjs`](check-app.mjs) | the four that need the built app: the route floor, and checks 5, 6 and 7     |
| [`reply.md`](reply.md)           | the one reply and its mechanical condition — and the two measures it rescues |
| [`record.md`](record.md)         | one copy per run, including the check that is yours                          |
| [`run.sh`](run.sh)               | the invocation, so nine runs differ in the prompt file and nothing else      |
| [`runs/`](runs)                  | the filled records, one per run                                              |

The prompts differ by exactly what the protocol allows, and that is checkable
rather than asserted. The comment at the top of each file is instructions to
the person, so the diff is taken over what the agent is actually given:

```bash
diff <(sed -n '/^Starting/,$p' prompt-d1.md) <(sed -n '/^Starting/,$p' prompt-d2.md)
diff <(sed -n '/^Starting/,$p' prompt-d2.md) <(sed -n '/^Starting/,$p' prompt-d3.md)
```

## What round 2 changes, and why

The [report's](../../research/2026-10-06-scenario-d.md) last section asked for
three things. Each one is a file in this folder.

**1. A task wide enough that splitting is the cheaper option.** Round 1 asked
for two resources sharing one relationship. No run split it; D3b measured the
width at 2 and the parallel part at ~150 lines and declined on arithmetic,
which is the right answer to that task and no answer at all to the question.

Round 2 asks for **four independent resources** — `projects`, `notes`, `tags`,
`budgets` — with create, read, list and delete each. Sixteen new routes, four
parts with no relationship between them, and **two shared surfaces where
parallel work can actually collide**:

- `src/app.ts`, which every part has to register itself on;
- `src/body.ts`, which only knows strings and booleans, while `budgets.limit`
  is a number — so the shared validator has to change, and only once.

Nobody is told either of those things. They are properties of the task.

**2. A gate with finer resolution** — the two deterministic checks that round
1's independent reviewer found, and per
[ADR 0014](../../decisions/0014-crew-runtime-deferred.md) only those. They are
`check 6` and `check 7` in [`check-app.mjs`](check-app.mjs), and the section
below shows them catching exactly what they were written for.

**3. The answer policy from the first run**, for all three configurations,
plus a redefinition of the two measures headlessness took away. Both are in
[`reply.md`](reply.md). The short version: **decisions surfaced** now counts
what a run _named_, asked or recorded, instead of what it managed to ask — and
its complement, **decisions settled silently**, out of the five the task
deliberately leaves open.

## Round 2's numbers are not round 1's numbers

Two things moved under them, and both on purpose:

- the task is four resources rather than two;
- `ts-http-service` is **1.3.0**, which ships `src/body.ts` — the body
  validation each of round 1's six runs improvised for itself, with the two
  defects round 1's reviewer found already impossible there.

So a round 2 run starts from a better project and is asked for more work.
Comparisons run **within** round 2, between D1, D2 and D3. Any sentence that
puts a round 1 cost beside a round 2 cost is wrong.

## The baseline project, once

Nine runs have to start from the same place, and running a 22-step recipe nine
times adds variance rather than removing it. Build it once, verified:

```bash
pnpm forgeprint test-setup ts-http-service --options framework=hono --keep
```

That runs every step and checks every one, and `--keep` leaves the directory it
built. Copy it, add the agent's context file, and freeze it:

```bash
pnpm forgeprint get ts-http-service --agent claude-code \
  --options framework=hono --out ~/scenario-d/baseline-r2
cd ~/scenario-d/baseline-r2 && git init -q && git add -A && git commit -qm baseline
```

Pin `framework=hono` everywhere. It is the first declared value, so it is what
a pull request's `setup-test` runs — and leaving it unpinned means the runs can
differ in which framework they started from, which is not the thing being
measured.

Two things to remove before freezing, both of which round 1 also removed:

- `health.json`, `service.url`, `refused.code`, `refused.json` — `test-setup`'s
  own verification output, which is the recipe's checks and not the project;
- `setup.md`, which `forgeprint get` writes. It is the recipe. A run that can
  read the recipe is not starting from a project.

The frozen baseline is **3 routes and 14 assertions**, which is where
`check 0b` and `check 1c` get their floors.

## Running a run

```bash
bash run.sh start d1 a ~/scenario-d/baseline-r2 ~/scenario-d
```

That copies the baseline to `run-d1a`, installs the expert when the
configuration is D3, runs the one invocation, and writes the session's own
usage report next to it. Then the gate, which is yours to run and never read
off the agent's own report:

```bash
bash checks.sh ~/scenario-d/run-d1a ~/scenario-d/baseline-r2
node check-app.mjs ~/scenario-d/run-d1a
```

If `check 0` failed, and only then, [`reply.md`](reply.md) applies:

```bash
bash run.sh reply ~/scenario-d d1a
```

## The gate was checked in both directions

A gate nobody has seen pass is not a gate. It was run against the frozen
baseline, against a reference implementation of the task written by hand
outside the repository, and against that reference with one defect
reintroduced at a time.

**Against the baseline** — the floors fire, and nothing else is claimed:

```
FAIL   check 0   nothing under src/ changed — the task was not implemented
FAIL   check 1c  14 assertions against the baseline's 14 — nothing was added
FAIL  check 0b  3 routes declared, floor 19 — the task is not implemented
FAIL  check 0b  /projects: 0 routes, needs create, read, list and delete
note  checks 5, 6 and 7 not run for: /projects, /notes, /tags, /budgets
```

This is the failure round 1 had to add `check 0` for, now failing before any
run rather than after four records had been written.

**Against the reference implementation** — all seven of the shell assertions
and all 53 of `check-app.mjs`'s:

```
7 passed, 0 failed, of the assertions above (protocol checks 1, 2 and 4, plus a floor).

PASS  check 0b  19 routes declared, floor 19 (baseline 3 + 16)
checks 0b, 5, 6 and 7 pass.
```

**With defect A reintroduced** — one resource validating itself instead of
reusing `src/body.ts`, with `parsed.archived ?? false` where a `typeof` test
belongs, and its own test for that removed:

```
7 passed, 0 failed, of the assertions above (protocol checks 1, 2 and 4, plus a floor).

FAIL  check 6   POST /projects  archived (boolean) = null -> 201, wanted 400
FAIL  check 6   POST /projects  archived (boolean) = "yes" -> 201, wanted 400
FAIL  check 6   POST /projects  archived (boolean) = 1 -> 201, wanted 400
```

**Every check round 1 had is green.** That is the whole argument for check 6 in
one screen: this defect shipped in round 1, passed all five acceptance checks,
and was found only because one run happened to spawn a reviewer.

**With defect B reintroduced** — a friendlier refusal that names the field it
rejected, and its own test for that removed:

```
7 passed, 0 failed, of the assertions above (protocol checks 1, 2 and 4, plus a floor).

FAIL  check 7   POST /notes  refusal echoed zzzprobekey: {"error":"unknown field: zzzprobekey"}
```

**With defect C reintroduced** — a test file one level down, which
`node --test dist/*.test.js` never globs into, so it never fails:

```
note   assertions: 50, # pass 44 # fail 0
FAIL   check 1b  1 test file(s) below src/ are never run by dist/*.test.js
checks 0b, 5, 6 and 7 pass.
```

Each defect fails exactly its own check and nothing else. The reference
implementation and the three defect copies live outside the repository, with
the runs: a committed solution to the task is a solution the next round's
agents can find.

## What the gate deliberately does not check

Round 1's reviewer found a third defect and left it open: no content-type
check. It is as deterministic as the other two, and it is **not** here.

- The report counts two, and ADR 0014 says to write the checks a finding
  justifies **and only those**.
- `src/body.ts` already answers 415 to a body that is not `application/json`,
  so a check for it would mostly measure whether the agent reused the
  blueprint — which is a different question, and one `check 6` and `check 7`
  already answer better.

## What the agent is not told

That it is being measured, how it is being measured, or that there are other
runs. That `src/body.ts` will have to grow a number field. Which of the five
open decisions in [`reply.md`](reply.md) anybody cares about. The prompt is the
whole instruction.
