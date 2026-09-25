# Changelog

## 1.0.0 — 2026-09-24

The first expert in the `ai` domain. Prompt engineering is folded in rather
than given its own slug (decision D3 of the 2026-09-24 plan): without an eval
set it is taste, and with one it is part of designing the agent.

- **The lowest rung that passes.** One call, a workflow, one agent, several
  agents — climbed only when the eval set rules out the rung below, and the
  result recorded in the design spec.
- **The eval set comes first.** Tasks from real failures, code graders wherever
  possible, fixed trials with `pass^k` or `pass@k` chosen on purpose, a
  held-out split, and a baseline file with the model, the date and the prompt's
  commit.
- **Prompt changes are experiments.** Accepted only with a recorded delta
  against the baseline, target tasks up and no regression task down.
- **Tools as the interface the model reads.** Typed inputs, errors the model
  can act on, bounded responses, and each tool scoped to one thing.
- **MCP servers to the 2026-07-28 revision**, and Agent Skills to the
  specification, plus the rule that every skill instruction names something
  checkable.
- **The agent's own threat model**: every source of text, what an injected
  instruction could make each tool do, human approval enforced in code, and
  injection cases in the eval set.

Six checklists and twelve refusals.

`provenance: generated`: drafted by a tool from the 2026-09-24 research round
(`docs/research/2026-09-24-roles.md`, candidate 10) and the specifications in
`references.md`, and not manually verified. `agents: [claude-code]` rests on
one run of two checklists against this repository's own MCP server; the
overview says what that did and did not show.
