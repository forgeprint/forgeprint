# Agent Designer

## What it changes

An agent asked to build an agent builds the most elaborate one it can: several
subagents, a tool per API endpoint, a long system prompt, and a prompt that is
reworded whenever an output looks wrong. None of it is measured, so none of it
can be shown to be better than something simpler. Four things change with this
expert:

- **It starts at the lowest rung and climbs only on evidence.** One call, then
  a workflow, then one agent, then several — and the design spec records the
  eval result that ruled out the rung below.
- **The eval set comes before the prompt.** Tasks from real failures, graders
  that are code wherever they can be, a held-out split, and a baseline file
  with the model, the date and the prompt's commit. A prompt change without a
  recorded delta against that baseline is refused.
- **Tools are designed as the interface the model reads.** Typed inputs, errors
  that say what to do next, bounded responses, and each tool scoped to one
  thing — because an injected instruction inherits whatever the tool can reach.
- **MCP servers and skills are held to their specifications**, at a named
  revision, plus the one test the specifications do not make: does each
  instruction in a skill name something the agent can check it did.

Six checklists — simplest design, tool design, MCP server, skill authoring,
evals and prompt changes, injection and agency — and twelve refusals. It
produces a design spec, an evaluation harness, a prompt suite and a threat
model, as files in the repository.

Prompt engineering is folded in here rather than given its own expert: without
an eval set it is taste, and with one it is this expert's section 3.

## What it fits

- Designing an agent, a tool surface or an MCP server before it is built.
- Reviewing one that exists — the checklists work as a review, one row at a
  time.
- Writing or reviewing a `SKILL.md`, including an expert for this catalog.
- Any prompt change to something that already has users. That is where a
  measured change and a guessed one differ the most.

## What it does not fit

- **Training or fine-tuning models.** It designs what surrounds a model; it
  says nothing about datasets, training runs or weights.
- **Retrieval quality engineering** — chunking, embeddings, index tuning. It
  will insist that retrieval is measured by the eval set, and stops there.
- **The security of the application around the agent.** Authentication,
  secrets, dependencies and the network edge belong to
  [`security-reviewer`](../security-reviewer/SKILL.md). This expert owns the
  agent's own threat model: what text reaches the context and what a tool can
  be made to do.
- **Running or orchestrating agents.** It designs them as a product. Splitting
  the work of building something across agents is
  [`technical-program-manager`](../technical-program-manager/SKILL.md), and
  Forgeprint has no runtime for either
  ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).
- **A one-off prompt for a one-off task.** Building an eval set for something
  that will run once is ceremony; the expert's own first rung says so.

## What it does not remove

- **An eval set measures what it contains.** A design that passes every task
  can still fail on the first input nobody thought of. Growing the set from
  real failures is the only answer, and it is slow.
- **Model graders are models.** Where a grader cannot be code, its verdicts
  vary, and the rubric only narrows that.
- **Specifications move.** The MCP revision it names changed the protocol's
  session model; the next one may change a row here. The 90-day re-check in
  `references.md` is part of the expert, not an afterthought.

## Pros and cons

**In its favour:** every rule is a file, a field or a command, and the central
one — no prompt change without a baseline — is the cheapest insurance an agent
project can buy. It is stack-neutral and harness-neutral: promptfoo, Inspect or
a script all satisfy it, as long as the results are files.

**Against it:** it is slower at the start. Writing 20 tasks and a baseline
before the first prompt feels like delay, and on a prototype that will be
thrown away it is. It is also `provenance: generated`, written from the
specifications and published guidance rather than from years of practice.

**What `agents: [claude-code]` rests on, exactly.** Claude Code applied the
`mcp-server` and `tool-design` checklists once, to this repository's own MCP
server. MS3 passed: execution failures come back as `isError: true` results.
Two rows did not. MS4: none of the ten tools declares annotations, although
all ten only return text, so under the specification's defaults a client may
treat each as destructive and open-world. MS1: the package README names
no protocol revision; only the pinned SDK in `package.json` implies one. That is one run, of two checklists, on
a server rather than on an agent, and nothing was measured with an eval set.
If the expert changes nothing about what your agent does, say so in an issue.
