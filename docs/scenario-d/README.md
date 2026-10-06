# Scenario D — the materials

The protocol is [docs/scenario-d.md](../scenario-d.md). This folder is what it
asks to exist **before the first run**, because a check written after watching a
run is a check that run passes.

| File                           | What it is                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- |
| [`prompt-d1.md`](prompt-d1.md) | the baseline prompt, pasted unchanged                                         |
| [`prompt-d2.md`](prompt-d2.md) | D1 plus one sentence allowing subagents                                       |
| [`prompt-d3.md`](prompt-d3.md) | D2 with the `technical-program-manager` expert named                          |
| [`checks.sh`](checks.sh)       | the three acceptance checks a script can hold honestly                        |
| [`check5.mjs`](check5.mjs)     | acceptance check 5, which needs a token and so cannot sit in the shell script |
| [`record.md`](record.md)       | one copy per run, including the two checks that are yours                     |
| [`runs/`](runs)                | the filled records, one per run                                               |

The prompts differ by exactly what the protocol allows, and that is checkable
rather than asserted:

```bash
diff prompt-d1.md prompt-d2.md     # one sentence
diff prompt-d2.md prompt-d3.md     # that sentence, extended
```

## The baseline project, once

Six runs have to start from the same place, and running a 26-step recipe six
times adds variance rather than removing it. Build it once, verified:

```bash
pnpm forgeprint test-setup ts-http-service --options framework=hono --keep
```

That runs every step and checks every one, and `--keep` leaves the directory it
built. Copy it to `~/scenario-d/baseline`, add the agent's context file, and
freeze it:

```bash
pnpm forgeprint get ts-http-service --agent claude-code \
  --options framework=hono --out ~/scenario-d/baseline
cd ~/scenario-d/baseline && git init -q && git add -A && git commit -qm baseline
```

Pin `framework=hono` everywhere. It is the first declared value, so it is what
a pull request's `setup-test` runs — and leaving it unpinned means the runs can
differ in which framework they started from, which is not the thing being
measured.

`test-setup` leaves its own verification output behind — `health.json`,
`service.url`, `refused.code`, `refused.json`. Delete those four before
freezing; they are the recipe's checks, not the project.

Then, per run:

```bash
cp -R ~/scenario-d/baseline ~/scenario-d/run-d1a
```

## The script was checked in both directions

Against the baseline, all five assertions pass. Against a copy with three
deliberate defects — a test file buried in `src/deep/`, one `@ts-ignore`, and
the route-table test renamed — it fails exactly those three.

That negative run also demonstrates why check 1b exists rather than merely
arguing for it:

```
PASS   check 1a  npm test
note   assertions: 6, # pass 5 # fail 0
FAIL   check 1b  1 test file(s) below src/ are never run by dist/*.test.js
       src/deep/buried.test.ts
```

The buried file asserts `fail()` on every run. `npm test` passed anyway,
because `node --test dist/*.test.js` does not glob into subdirectories — so a
test that cannot run is a test that never fails, and check 1 would have been
claimed without being met.

## What the agent is not told

That it is being measured, how it is being measured, or that there are other
runs. The prompt is the whole instruction.
