# Technical Program Manager

## What it changes

An agent that can start subagents will start them. It splits a task because it
can, hands each worker a paraphrase, lets two of them decide the same interface
differently, and reports the whole job done because every worker said its part
was. Each of those is a documented failure mode, and none of them shows until
the parts are put together. Four things change with this expert:

- **It decides whether to split before splitting.** It counts the width of the
  task graph and does not split a job with none. That is the change most likely
  to save money, because several agents cost many times what one does.
- **Workers get files and section references, not summaries**, and the user's
  original request is kept verbatim so the end result can be held against it.
- **Shared interfaces are frozen before parallel work starts**, and every
  worker has its own paths. A collision becomes a planning error rather than a
  surprise at the end.
- **Nothing is done until something other than the worker checked it.** The
  verify commands are run again, the output is kept, and "done" is said only
  when every task is verified.

Three checklists — before fan-out, at each handoff, before "done" — and twelve
refusals. It produces a delivery plan, an assumption log and a report, as files
in the repository.

## What it fits

- A task about to be handed to subagents, in any agent that can start them.
- A multi-part change where the parts share an interface: an API and its
  client, a schema and the code on both sides of it.
- A single agent doing a long job alone. Section 7's rule — the command, run
  afresh, decides; the memory of it passing does not — matters most there.
- Reviewing a plan somebody else's agent produced, using the before-fan-out
  checklist as the review.

## What it does not fit

- **Small tasks.** Its first rule is to not split a job with no parallel width,
  and on a small task that is the whole of its advice.
- **Judging whether the code in a branch is good.** It checks that each branch
  was verified against its criteria; whether the criteria were the right ones
  for that technology is the stack expert's job.
- **Running anything.** It does not start agents, create worktrees, schedule
  work or execute verification. It is text an agent reads and files an agent
  writes. A runtime that enforces it was considered and deliberately not built
  ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).
- **People management.** The title is the one the taxonomy has for this work;
  hiring, growth and one-to-ones are not in it.

## What it does not remove

These are real, and writing them down does not make them smaller:

- **A model's judgment is still a model's judgment.** A plan can be complete,
  every field filled, and still wrong about the problem.
- **Cost.** Several agents cost several times one agent even when everything
  here is followed. The expert reduces waste; it does not make splitting free.
- **A wrong spec misleads everyone downstream**, faithfully. Keeping the brief
  verbatim and comparing the report against it (D7) is the only defence here,
  and it catches the problem at the end, not at the start.

## Pros and cons

**In its favour:** every rule answers a failure somebody measured, the sources
are named, and every check is a file, a field or a command. It asks for
nothing to be installed, and it works the same whether the agent runs workers
in parallel or one after another.

**Against it:** it adds files and ceremony, and on work that did not need
splitting the ceremony is pure cost — which is exactly why its first rule is to
refuse the split. It is also `provenance: generated`, written from the research
above rather than from practice.

**What `agents: [claude-code]` rests on, exactly.** Claude Code followed it once,
to write the plan in [`examples/`](examples/delivery-plan.yaml) for the
reference task. Holding each `verify` command to "run it, do not assume it"
caught two things the first draft got wrong: a lint step for a project that has
no lint script, and test files placed where the project's test command never
looks — tests that would never run and so never fail. That is one run, on a
plan rather than on a delivery, with no second agent involved.
[Scenario D ran on 2026-10-06](../../docs/research/2026-10-06-scenario-d.md),
six runs, and the honest summary is this. Against the protocol's own measures —
false completions, collisions, rejected work — this expert is **not** better
than the same task done without it: all three were zero everywhere, because no
run split the work, including both runs that had these principles. Both of those
decided against splitting and said why, which is the first instruction here and
is a defensible answer rather than a failure to follow it. It cost roughly twice
as much: $1.24–1.37 against $0.68–0.69.

What it did do, once: the run that used a subagent spent it on an independent
read-only reviewer, which found three defects the acceptance checks do not ask
about — a boolean field accepting `null`, an unvalidated key echoed back in an
error, and a missing content-type check. Two were fixed before the run
finished. That is one run, on a task too small to need splitting at all.

So: it changes what an agent does, in the direction claimed here, and the
measurable part of that change is one reviewer on one run. If it changes nothing
about what your agent does, say so in an issue — that is still the evidence it
most needs.
