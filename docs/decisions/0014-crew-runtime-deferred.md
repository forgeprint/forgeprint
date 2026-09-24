# 14. Multi-agent delivery is a way of working, not a runtime — for now

- Status: Accepted
- Date: 2026-09-24
- Deciders: core maintainer
- Constrained by: CLAUDE.md §1 ("Forgeprint never installs anything; it only
  returns the recipe"), rule 21, [ADR 0012](0012-experts-crews-integrations.md)
  (a crew is composition)

## Context

A crew names experts and integrations by slug and copies nothing (ADR 0012).
Nothing in Forgeprint runs one. What happens when a user's agent splits a job
across several agents is left entirely to that agent.

A proposal was considered that would change that. It had two halves.

**Seven principles**, each aimed at a known way multi-agent work fails:

| #   | Principle                                                                | Failure it addresses                       |
| --- | ------------------------------------------------------------------------ | ------------------------------------------ |
| P1  | One source of truth: work moves as files and section references, not as summaries | the request drifts as it is retold  |
| P2  | Whoever did the work does not verify it; a self-report is never "done"   | confident, unchecked completion            |
| P3  | Contract first: parallel work starts only after the shared interface is frozen | parallel branches that do not fit     |
| P4  | Ownership: each worker writes only to its own set of paths               | two agents editing one file                |
| P5  | A thin end-to-end slice before fanning out                               | a wrong assumption discovered at the end   |
| P6  | An assumption log; critical assumptions need the user before they spread | silent guesses multiplied by every worker  |
| P7  | A budget and a circuit breaker per task: attempts, tokens, time          | loops that spend without surfacing         |

**A runtime to enforce them**: a `.forgeprint/` workspace written into the
user's project (brief, spec, frozen contracts, a task graph, a ledger, evidence
directories), a `forgeprint crew` command family that checks plans, checks git
diffs against ownership, runs verification commands and writes their results,
hierarchical crews of up to two layers, and a `parallel` field in the agent
registry to drive worktrees.

## Decision

**The principles are adopted as content. The runtime is not built.**

The principles become an expert — `technical-program-manager`, the role in the
taxonomy whose job this already is: decomposing work across teams, freezing the
interfaces between them, keeping the assumption and status records, and not
calling anything done that nobody checked. Its deliverables are the plan, the
assumption log and the report, as files the user's agent writes. Its checklists
are P1–P7. The rule that the worker never verifies its own work goes into its
refusals.

That is what an expert is for (ADR 0012): a way of working, named by what it
produces and which checklists it applies. It is agent-agnostic by construction,
because it is text an agent reads. It needs nothing installed.

The runtime is deferred, for three reasons.

**It changes what Forgeprint is.** A workspace written into the user's project,
a command that executes their verification steps, and a scheduler for parallel
workers make Forgeprint a multi-agent execution framework. That is a different
product from a catalog that returns a recipe, and it competes with the agents
it is meant to serve — every agent that can run subagents already has an
opinion about how.

**It would rest on nothing measured.** The core loop — an agent resolving a
profile, receiving a recipe and running it — has been dogfooded through step 3
of 5. Nobody has asked for hierarchical crews, and the two crews in the catalog
are generated and unused. Building a safety layer for a feature with no users
answers a question nobody has put.

**Its own acceptance test can be run without it.** The proposal ended by
measuring a single agent against a flat crew against a hierarchical one. That
measurement does not need the runtime; it needs a task, an agent that supports
subagents, and a written protocol. It goes first.

## What would reopen this

Any of these, recorded in a dated report under `docs/research/` or
`docs/dogfood/`:

- **Scenario D shows a difference worth enforcing.** Same task, three
  configurations — one agent; several agents given the expert; several agents
  without it. If the expert measurably reduces rejected work, conflicts or user
  interventions, and the failures that remain are ones a deterministic check
  would have caught, the checks are worth writing.
- **The expert is used and the same failure keeps coming back.** An issue trail
  showing agents that read P2 and still mark their own work verified is the
  argument for a command that will not let them.
- **Demand.** Requests for a crew runtime through `request_blueprint` or issues,
  counted the way `catalog-research` counts everything else.

If it reopens, the order is fixed in advance: the smallest deterministic check
first (`plan-check`, which reads a file and executes nothing), and only then
anything that runs commands in the user's project, with an allowlist held to
the same rules `lint-setup` applies to a recipe.

## Consequences

- `MAX_CREW_MEMBERS` stays at 6, and a crew stays flat. Hierarchy was the
  runtime's premise, not the principles'.
- No `.forgeprint/` directory, no `forgeprint crew` commands, no `parallel`
  field in `schema/agents.yaml`.
- The taxonomy gains the deliverables the expert produces, in their own pull
  request (§3.1).
- [`docs/scenario-d.md`](../scenario-d.md) holds Scenario D as a protocol a
  person can run by hand.
- The residual risks the proposal named honestly do not go away by being
  written down: a model's judgment error, the cost of several agents over one,
  and a wrong spec misleading everyone downstream. The expert says so in its
  overview, which is where a reader decides whether to use it.

## Alternatives considered

**Build it as proposed.** Rejected for now, for the reasons above. The work is
not wasted: the principles, the file shapes and the check list are what this
ADR keeps, and they are what a runtime would enforce if one is ever justified.

**Reject it outright.** Rejected. The principles are sound and each answers a
failure that happens today, in any agent that splits work. Leaving them out of
the catalog because the runtime was premature would throw away the part that
costs nothing.

**Build only the deterministic checks now.** Closer, and the right first step
if this reopens. Not now, because a check for a plan format that nobody writes
yet validates nothing — the expert has to be used before its output is worth
checking.
