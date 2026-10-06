# The answer policy

D3's first run wrote a plan, surfaced four decisions and stopped, because the
`technical-program-manager` expert's first instruction is to decide whether to
split and not to guess what nobody has said. Headless, nobody can answer, so the
run ended with no implementation — and the round cannot compare what it set out
to compare.

So there is one reply, fixed here **before it is used**, and it is the same rule
for every run of the round:

> **If a run ends without having implemented anything — `check 0` in
> [`checks.sh`](checks.sh) fails — reply exactly once, with the text below, and
> let it finish. Otherwise reply nothing.**

```
Approved — proceed with all four proposals as written. Add nothing.
```

## Why this wording

- **It approves rather than decides.** The design is the agent's; agreeing to it
  is not the same as choosing it, and the records say which proposals were
  approved so a reader can see what was agreed to.
- **"Add nothing"** closes the obvious way a second turn could inflate the work
  being measured.
- **It is literal and reusable.** No run gets a reply tailored to what it asked,
  which would make the replies a variable.
- **It fires on a mechanical condition**, not on judgement about whether a run
  "seemed to be asking". `check 0` is a command.

## What it costs, stated

- **D3 becomes a two-turn run and D1/D2 were one-turn runs.** The rule is
  identical for all six; it simply never fires for a run that finished. That
  asymmetry is caused by the expert's behaviour rather than by the measurement,
  which is the thing the round is trying to see — but the comparison is no
  longer prompt-for-prompt and the report has to say so.
- **The reply is an intervention**, and the one the protocol counts. For D3 it
  is 1 by construction rather than 0 by headlessness, so the measure still is
  not comparable across configurations. It is recorded as "1, by policy".
- **Four proposals were approved sight-unseen by rule.** If one of them had been
  wrong, approving it is what the policy says to do, and the acceptance checks
  are what would catch it. That is the division the protocol already makes:
  the agent proposes, the checks decide.
