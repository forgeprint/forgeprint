# Scenario D, round 2 — the work was split, and the question changed

Date: 2026-10-12. Protocol: [`docs/scenario-d.md`](../scenario-d.md).
Materials and the nine filled records:
[`docs/scenario-d/round-2/`](../scenario-d/round-2/README.md).
Round 1's report: [2026-10-06](2026-10-06-scenario-d.md).

**Three runs per configuration, nine in all.** Round 1 had two per
configuration and said so; this is a better base and still a small one. The
numbers are **not comparable to round 1's**: the task is four independent
resources instead of two sharing a relationship, the baseline is
`ts-http-service` 1.3.0 rather than 1.2.x, and the gate has twelve checks
rather than seven.

---

## The one-line answer

**Two of the nine runs split the work, and both of them removed the hazard
[ADR 0014](../decisions/0014-crew-runtime-deferred.md) asks to observe — before
the parallel part began, by assigning each shared file to one task.** Round 1
could not measure conflicts because nobody split. Round 2 can say something
stronger and less convenient: when a run does split, the discipline that makes
splitting safe is the same discipline that makes the conflicts not happen, so
the runtime those conflicts were meant to justify has no symptom left to treat.

**ADR 0014 stays deferred**, for a different reason than last time: not for
want of evidence, but because the evidence points away from it.

## The runs

|                                 | D1a    | D1b    | D1c    | D2a    | D2b    | D2c    | D3a          | D3b            | D3c                   |
| ------------------------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------------ | -------------- | --------------------- |
| Wall time                       | 123 s  | 98 s   | 87 s   | 95 s   | 117 s  | 112 s  | 216 s        | 284 s          | 304 s                 |
| Turns                           | 10     | 9      | 8      | 10     | 11     | 10     | 16           | 14             | 15                    |
| Cost                            | $0.623 | $0.551 | $0.519 | $0.567 | $0.615 | $0.599 | **$1.485**   | **$3.216**     | **$3.058**            |
| Tokens out                      | 12 369 | 10 142 | 9 654  | 10 378 | 11 809 | 11 722 | 18 377       | 11 640         | 11 118                |
| Checks passed                   | 12/12  | 12/12  | 12/12  | 12/12  | 12/12  | 12/12  | 12/12        | 12/12          | **11/12**             |
| **False completions**           | 0      | 0      | 0      | 0      | 0      | 0      | 0            | 0              | 0                     |
| **Subagents spawned**           | 0      | 0      | 0      | 0      | 0      | 0      | 0            | **3, workers** | **3, workers**        |
| **Resources given to a worker** | 0/4    | 0/4    | 0/4    | 0/4    | 0/4    | 0/4    | 0/4          | **3/4**, tests | **3/4**, code + tests |
| **Collisions**                  | 0      | 0      | 0      | 0      | 0      | 0      | 0            | 0              | 0                     |
| **Rework**                      | 0      | 0      | 0      | 0      | 0      | 0      | 0            | 0              | 0                     |
| Interventions                   | 0      | 0      | 0      | 0      | 0      | 0      | 1, by policy | 1, by policy   | 1, by policy          |
| Decisions surfaced              | 8      | 7      | 6      | 6      | 7      | 6      | 7            | 8              | 7                     |
| Decisions settled silently      | 2/5    | 2/5    | 2/5    | 2/5    | 2/5    | 2/5    | 2/5          | 2/5            | 2/5                   |
| Test assertions                 | 137    | 72     | 100    | 136    | 186    | 101    | 169          | 178            | 160                   |

Environment, identical across all nine: headless `claude -p`, `--model opus`,
`--strict-mcp-config`, `--permission-mode bypassPermissions`, the same frozen
baseline (`framework=hono`, 22 recipe steps verified), prompts read from the
committed files by [`run.sh`](../scenario-d/round-2/run.sh) rather than
retyped. The CLI was 2.1.291 for D1a–D2b, 2.1.293 for D2c–D3a and 2.1.296 for
D3b–D3c; D3b's first attempt on 2026-10-06 never reached the model (expired
credentials, zero output tokens) and was deleted rather than recorded.

## The three things round 1 asked for, and what each produced

### 1. A task wide enough that splitting is the cheaper option

Delivered as width 4 with two shared surfaces. **It did not make splitting the
cheaper option — it made splitting happen and cost more.**

- D1 (no permission): 0 of 3 split, mean $0.564.
- D2 (permission, no expert): 0 of 3 split, mean $0.594. **Six runs in two
  rounds have now been told they may use subagents and have declined.**
- D3 (permission + expert): 2 of 3 split, mean $2.586.

The two splitting runs cost $3.216 and $3.058 against $1.485 for the expert run
that declined — so inside the same configuration, splitting roughly doubled the
bill. Against the six-run non-expert mean of $0.579 the splitting runs are
**5.6× and 5.3×**.

Round 1 wrote that the expert "changed behaviour in the direction it claims and
cost roughly twice as much". At four resources the direction holds and the
multiplier is 4.5× for the configuration and 5.5× when it actually splits.

### 2. A gate with finer resolution

The two checks round 1's reviewer found were written and only those
([`check-app.mjs`](../scenario-d/round-2/check-app.mjs) checks 6 and 7). Both
passed in all nine runs. **They were written against defects that round 1
produced and round 2 never reproduced**, which is the honest outcome of writing
a check from one observation: it is cheap, it is permanent, and it may measure
a hazard the next nine runs do not have.

What the finer gate actually caught was the thing round 1's gate let through —
an empty run. `check 0` and `check 1c` failed in exactly the three runs that
planned before coding (all three D3), which is how the policy reply got fired
on a mechanical condition rather than on judgement.

And one check was wrong. `check 1b` flags any `*.test.ts` two levels under
`src/`, because the blueprint's test command does not glob into
subdirectories. D3c moved its four resource test files into `src/resources/`
**and widened the command in the same task**:

```
npm test → # tests 133, # pass 133   (117 of them in the four files)
```

The tests run. The condition the check exists to detect — a test that cannot
fail — was absent, so D3c is recorded as 11 of 12 with the twelfth a false
positive, and the gate was not amended mid-round. The lesson is narrower than
"the check is bad": **a check written against one command's glob measures the
glob, not the property.** Nine runs in, that proxy has produced one false
positive and no true ones.

### 3. A policy-fixed reply from the first run

It worked exactly as intended, and it produced the round's cleanest split
between configurations. The reply fired in **3 of 3** D3 runs and **0 of 6**
others, because only the expert runs stopped before writing code. Interventions
stayed at one, by policy, in those three and zero everywhere else — so
"interventions" is finally a measure of the configuration rather than of the
person watching.

The redefinition also held: counting decisions **named** rather than questions
asked gave a number for all nine runs. It is flat — 6 to 8 everywhere, 2 of 5
settled silently in every single run — which says the expert does not surface
more decisions. It changes which ones it stops for: all three D3 runs separated
"critical, needs approval" from "default, proceeding", and no other run made
that distinction at all.

## What the splitting runs actually did

|                                | D3b                         | D3c                           |
| ------------------------------ | --------------------------- | ----------------------------- |
| Shared `body.ts`               | coordinator, task 1         | coordinator, task 0           |
| Shared `app.ts`                | coordinator, task 1         | coordinator, task 5           |
| Resource definitions           | coordinator                 | **workers**                   |
| Resource tests                 | **workers** (one file each) | **workers** (with their code) |
| Contract frozen before fan-out | yes, written                | yes, written                  |
| Collisions                     | 0                           | 0                             |

Two different partitions, one invariant: **the shared file was given a single
owner before any worker started.** D3b went further and said so in writing,
recording a post-approval change "to keep paths disjoint and `app.ts`
single-owner".

This is the round's central finding, and it cuts against the runtime. ADR 0014
asks to see conflicts on a shared surface, work discarded, and a worker
declaring its own work done. What nine runs show is that a competent split
makes the first impossible by construction, and that the expert's own
verification rule handles the third: in both runs every worker's verify command
was re-run by the coordinator rather than believed, and D3b additionally hashed
all 16 pre-fan-out files and re-checked them afterwards.

### The one coordination cost either round has recorded

> All three workers reported that the check command I gave them failed.
> Compiled output in a temporary directory could not resolve `jose`. Each
> worker worked around it with a `node_modules` symlink outside the repo. The
> coordinator removed those symlinks afterwards. — D3b, `delivery/report.md`

A coordinator-authored verify command that did not work, three workers
independently inventing the same workaround outside the project, and a cleanup
pass. No output was discarded, so `Rework` stays 0 — and this is still the only
thing in eighteen runs that looks like the overhead a runtime would exist to
manage. It was caused by the coordination itself.

## What the gate cannot see, measured nine times

Twelve checks pass on runs that answer the same unasked question differently.
Round 1 found this on "cascade or refuse"; round 2 measured it on five
decisions the task is silent about, for four resources each.

**Within a run: no disagreement anywhere.** Nine runs, 36 resource-decisions,
and only one answer any two runs differ on — `limit = 1e13`, accepted by eight
runs and refused by D3b, which bounded it at 1e12. D3c is the only run to have
_decided_ it in writing ("no upper bound beyond JSON"), so the disagreement is
now between two stated positions.

**Across runs: the `sub` claim.** The task says a token is required and never
says what a token whose `sub` is not a usable string means.

| `sub`  | D1a | D1b | D1c | D2a | D2b | D2c | D3a | D3b | D3c |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `"u1"` | 201 | 201 | 201 | 201 | 201 | 201 | 201 | 201 | 201 |
| `123`  | 401 | 401 | 401 | 201 | 500 | 401 | 201 | 201 | 201 |
| `""`   | 401 | 401 | 401 | 201 | 500 | 401 | 201 | 201 | 201 |

Three patterns — refuse, accept, or answer 500 — and **twelve of twelve on all
nine.** The identical rows hide different code: D3a's `?? ''` filed every
unusable `sub` under one shared owner, while D3b and D3c require the claim at
the door and use the value as it arrives, which was measured directly (no
`sub` → 401, no cross-owner reads). The run that was most careful to get A2
approved implemented it least safely, and the gate could not tell.

## The defect nobody was asked about

`src/body.ts` 1.3.0 tests membership with `key in shape`, and `in` walks the
prototype chain:

```
{ name: 'a', zzzextra: 1 }    -> 400
{ name: 'a', constructor: 1 } -> 201
```

**Two of nine runs found and fixed it: D1a and D2b.** Both were runs without
the expert. All three D3 runs extended `body.ts` deliberately — adding a
`number` kind, in one case with bounds — and none looked at the two membership
tests next to the code they were writing. D3b wrote an eight-mutation suite for
its own tests and still missed it, because its mutations tested the behaviour
it had written.

The catalog's fix shipped as `ts-http-service` 1.3.1 on 2026-10-09, found by
this round and not by review. Round 1 produced two such defects; this is the
measurement pattern holding for a second round: **the runs find things in the
blueprint that the gate does not ask about, and that is the cheapest output of
the whole exercise.**

## Two things worth keeping that are not about ADR 0014

- **Mutation testing appeared, twice, and only with the expert.** D3b injected
  eight defects into a copy and confirmed each was caught — discarding its own
  first attempt as an equivalent mutant — and D3c injected one at the
  authorisation boundary. Seven of nine runs produced tests whose power nobody
  checked. This is the one capability the expert added that no run without it
  attempted, and it is not in ADR 0014's list.
- **Three runs read the task's silence the same way.** Every D3 run separated
  decisions needing approval from defaults it would proceed on, and the three
  critical ones were nearly identical across runs (storage, ownership, the
  numeric type). A reply policy of one sentence was enough to unblock all three.

## Verdict

- **ADR 0014 stays deferred.** Round 1 deferred it for want of a split. Round 2
  got two splits and found that the conflicts, the discarded work and the
  self-declared completions did not appear — not by luck, but because the
  practice that makes a split work is what prevents them. A runtime whose
  justification is those symptoms needs a case where competent practice is not
  enough, and nine runs have not produced one.
- **The expert does what its overview claims, at 4.5× the cost of a run without
  it and 5.5× when it splits.** It is the only configuration that stops for
  approval, the only one that mutation-tests its own tests, and the only one
  that split the work at all. It is not better on any protocol measure: twelve
  of twelve everywhere, zero false completions everywhere, the same 2 of 5
  decisions settled silently everywhere.
- **The gate learned more than the runtime question did.** Checks 6 and 7 cost
  nothing and caught nothing; `check 0`/`0b`/`1c` caught the empty run three
  times; `check 1b` produced the round's only red and it was wrong. The next
  change to the gate is to test the property (`npm test` reaches every test
  file) rather than one command's glob — and, per ADR 0014, to write it only
  when a run has actually hidden a test.
- **Two rounds, eighteen runs, two real catalog defects found by measurement.**
  Prototype keys in `body.ts` (1.3.1) and the SDK-patch-dependent pins in
  `blazor-web-app`. Neither came from review.

## What a third round would need

Not more runs of this shape. A third round is worth running only if it changes
the thing round 2 could not:

1. **A task where the partition cannot be made disjoint** — two resources that
   must both change the same file, with no ordering that avoids it. Round 2's
   two shared surfaces were avoidable, and both splitting runs avoided them.
2. **A worker that cannot be trusted to verify itself**, which in practice
   means a longer task where re-running everything centrally is too expensive.
   Both splitting runs re-verified every worker centrally in under four minutes.
3. **Nothing about the expert.** The configuration question is answered as far
   as nine runs can answer it: it changes behaviour, it costs 4.5×, and the
   behaviour it changes is worth it for work where a wrong assumption forces a
   redo. That belongs in the expert's overview, not in another round.
