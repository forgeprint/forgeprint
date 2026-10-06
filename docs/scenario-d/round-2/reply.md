# The answer policy, and the two measures it exists to rescue

Round 1 wrote this rule in the middle of the round, after D3's first run
produced a plan, surfaced four decisions and stopped with nothing implemented.
The rule was sound and it was written before it was used, but it had only ever
applied to one configuration, and the
[report](../../research/2026-10-06-scenario-d.md) asked round 2 to have it from
the first run. This is that file, committed before run 1 of 9.

> **If a run ends without having implemented anything — `check 0` in
> [`checks.sh`](checks.sh) fails — reply exactly once, with the text below, and
> let it finish. Otherwise reply nothing.**

```
Approved — proceed with all four proposals as written. Add nothing.
```

[`run.sh reply`](run.sh) sends exactly this, by resuming the same session, so
turn 2 is the same run rather than a second one.

## Why this wording, unchanged from round 1

- **It approves rather than decides.** The design is the agent's; agreeing to
  it is not the same as choosing it, and the record says which proposals were
  approved so a reader can see what was agreed to.
- **"Add nothing"** closes the obvious way a second turn could inflate the work
  being measured.
- **It is literal and reusable.** No run gets a reply tailored to what it
  asked, which would make the replies a variable.
- **It fires on a mechanical condition**, not on a judgement about whether a run
  "seemed to be asking". `check 0` is a command.

The text says "all four proposals" because round 1's D3a made four. A run that
surfaces three or seven is approved by the same sentence; the count in it is
history rather than instruction, and changing the wording between runs would
cost more than the inaccuracy does.

## The two measures, redefined so nine runs can carry them

Round 1 lost two of its eight measures to headlessness: an agent that cannot
ask surfaces no assumptions and needs no interventions, so **interventions**
and **assumptions surfaced** were structurally zero everywhere except the one
run that stopped. The measure that the expert exists to move was the measure the
environment removed.

The fix is not to make the runs interactive — that buys the measure and pays
with human variance across nine runs. It is to count what a headless run can
still do:

| Measure                        | Round 2 definition                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Decisions surfaced**         | every decision the run **names** — in its final message, or in a file it wrote — whether it asked about it or recorded it and proceeded. Counted from the transcript and the run directory, by the person, after the run |
| **Decisions settled silently** | every one of the five listed below that the code answers and the run never named. The complement, and the more interesting half                                                                                          |
| **Interventions**              | anything said to the run that is not the policy reply above. Expected 0. Where the policy fired it is recorded as "1, by policy", not as a measurement                                                                   |

Both halves are countable in all nine runs, and the pair is what round 1's
"assumptions surfaced" was reaching for: not whether the agent could ask, but
whether it knew it was choosing.

### The five decisions the task deliberately does not make

The prompt names the four resources and their fields and stops. These are left
open, and **all four resources have to answer them the same way** or the
service contradicts itself:

1. What a second `DELETE` of the same id answers.
2. What reading, or deleting, an id that never existed answers.
3. Whether a body with an unknown field is refused or ignored.
4. Whether `tags.label` — or any other field — has to be unique.
5. What `budgets.limit` accepts: negative, zero, fractional, enormous.

Round 1's equivalent was a single question — what deleting a project with
tasks does — and three of six runs cascaded while three refused, every one of
them self-consistent and silent about it. Four independent resources turn that
into five questions answered four times each, which is where work split across
workers diverges without anybody noticing.
