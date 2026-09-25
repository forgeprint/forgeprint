---
name: agent-designer
description: Design LLM agents, their tools, MCP servers and Agent Skills, and prove them with evals — the simplest shape that works (a workflow before an agent, one agent before several), tools with typed inputs, scoped access and errors the model can act on, MCP servers built to the current specification, skills whose every instruction can be checked, and prompt changes made only against an eval set with a recorded baseline. Use when designing or reviewing an agent, a tool surface, an MCP server or a SKILL.md, or before changing any prompt.
license: CC-BY-4.0
---

# Designing agents, and proving them

An agent that was never measured is a demo. A prompt changed because the new
wording "feels better" is a coin flip with a commit message. What turns agent
work into engineering is an eval set that existed **before** the change and a
number it produced **before** the change.

**The bar, in one sentence:** _no design decision and no prompt change without
a file that shows what it was measured against._

Standards and versions are in [`references.md`](references.md). Security
references the catalog already tracks stay in
[`docs/review-standards.md`](../../docs/review-standards.md).

---

## 1. Choose the shape: the lowest rung that passes

Climb one rung at a time, and only when the rung below has failed the eval set
(section 2), not when it merely looks too simple (Anthropic BEA 2024):

1. **One model call** with good context and retrieval.
2. **A workflow**: fixed code paths — chaining, routing, parallelisation,
   evaluator-optimizer. The path is in code, so it can be tested like code.
3. **One agent**: the model chooses its own steps and tools, in a loop with a
   stopping condition.
4. **Several agents**: only for work that is wide, parallel and needs little
   shared context. Multi-agent systems use about fifteen times the tokens of a
   chat (Anthropic MA 2025), and most coding work does not parallelise well.

Write the choice into the design spec: the rung chosen, the rung below it, and
the eval result that ruled the lower one out. "An agent felt more flexible" is
not a result.

---

## 2. The eval set comes first

Before any prompt, tool description or skill is written or changed, there is
an eval set in the repository — `evals/<name>/` or wherever the project keeps
them (Anthropic evals 2026):

- **Tasks from real failures**, 20 to 50 to start, each unambiguous enough that
  two people would grade it the same way, with a reference solution that proves
  it is solvable.
- **A grader per task**: code-based wherever the outcome can be checked by a
  command, model-based only where it cannot, and the model grader's rubric
  written down.
- **Trials per task** fixed in the config. Report `pass^k` — every trial passed
  — when the product needs every run right; `pass@k` only when one success in
  k is genuinely enough.
- **A held-out split** that is never looked at while tuning (Anthropic tools
  2025). A prompt tuned on the cases that score it has only learned the cases.
- **A baseline file**: model identifier, date, trials, score per task and in
  total, and the commit of the prompt it ran. No baseline, no change.

The harness is yours to pick — promptfoo, Inspect, or a script — as long as the
config and the results are files somebody else can rerun.

---

## 3. Prompt changes are experiments

The prompts are files in the repository (the **prompt suite**), never strings
edited in place. A change to one is accepted only when:

1. the baseline for the same model exists;
2. the eval set was rerun after the change, with the same trials;
3. the delta is recorded next to the change — target tasks up, and **no
   regression task down**;
4. the held-out split was run once at the end, not during tuning.

One change per run. Two changes in one run are two hypotheses with one answer.

---

## 4. Tools: the interface the model actually reads

A tool definition is a prompt (Anthropic tools 2025). Keep an inventory — one
row per tool: name, what it reads, what it writes, the scope of each, its
annotations, and every error it returns. Then:

- **Fewer, task-shaped tools** rather than one per API endpoint; prefixes that
  say which system a tool belongs to.
- **Typed inputs**: a JSON Schema with required fields, enums instead of free
  strings, `additionalProperties: false`. Make the wrong call hard to express
  (poka-yoke, Anthropic BEA 2024).
- **Errors the model can act on**: what was wrong, the accepted values, what to
  call instead. A stack trace or "an error occurred" is a dead end.
- **Bounded responses**: pagination, filtering and truncation with defaults,
  and human-readable identifiers rather than opaque ones.
- **Least privilege**: each tool reaches one scoped thing. No open-ended shell,
  no free SQL, no write to any path (LLM06:2025).

---

## 5. MCP servers, to the specification

Build to the revision you name — currently **2026-07-28** — and say which in
the README. [`checklists/mcp-server.md`](checklists/mcp-server.md) covers it:
valid input schemas, `isError: true` for execution errors so the model can
correct itself, honest annotations, state carried as caller-bound handles
rather than connection state, and no token accepted that was not issued for
this server.

---

## 6. Skills: every instruction checkable

A `SKILL.md` follows the Agent Skills specification: `name` matching the
folder, a `description` that says what it does **and when to use it**, the
body under 500 lines, references one level deep. Beyond the format:

- **Every instruction is one the agent can verify it followed** — a file that
  must exist, a command that must pass, a field that must be filled. Anything
  else is decoration; turn it into a check or delete it.
- **Three evals at least, and a baseline without the skill** (Anthropic skills
  BP). A skill that does not beat its own absence is not a skill.

---

## 7. Untrusted text and excessive agency

Write a threat model for the agent as part of the design spec:

1. **List every source of text that reaches the context** — user input,
   retrieved documents, web pages, tool results, other servers' tool
   descriptions. Mark which are untrusted. Most are.
2. **For each tool, ask what an instruction hidden in that text could make it
   do** (LLM01:2025). The answer sets its scope.
3. **Human approval before anything destructive or outbound** — a write, a
   send, a payment, a deletion (LLM06:2025).
4. **Model output is data**: validated before it reaches a shell, a query, a
   URL or a renderer (LLM05:2025).
5. **The system prompt is not a secret and not a control** (LLM07:2025).
   Anything that must hold is enforced in code.
6. **Injection cases go into the eval set**, so a prompt change that weakens a
   defence shows up as a regression.

---

## 8. What you refuse

| Refuse                                                          | Because                                            |
| --------------------------------------------------------------- | -------------------------------------------------- |
| A prompt change with no recorded eval delta                     | It is a guess, and the next guess will undo it     |
| An eval set with no baseline, or a baseline from another model  | There is nothing to compare against                |
| Tuning against the held-out split                               | The score stops meaning anything                   |
| An agent where a workflow passes the eval set                   | Cost and variance with nothing bought              |
| Several agents where one was never measured                     | About fifteen times the tokens, on faith           |
| A tool with unscoped write access                               | Any injected instruction inherits it               |
| A tool whose errors are stack traces or "failed"                | The model cannot correct what it cannot read       |
| A destructive or outbound action with no human approval         | Excessive autonomy, by definition                  |
| Model output passed to a shell, query or renderer unvalidated   | Improper output handling                           |
| An MCP server that forwards a token issued for another resource | Token passthrough, which the specification forbids |
| A skill instruction nobody can check was followed               | It changes nothing about what the agent does       |
| Treating another server's tool descriptions as trusted          | The specification says to treat them as untrusted  |

---

## 9. What you produce

| Deliverable        | What it looks like                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Design spec        | The rung chosen and why the lower one failed; the tool inventory; stopping conditions; the threat model |
| Evaluation harness | `evals/<name>/`: cases, graders, trials, held-out split, `baseline` file, and one results file per run  |
| Prompt suite       | The prompts as versioned files, each change paired with its eval delta                                  |
| Threat model       | Section 7 as a table: source, trust, reachable tools, control, and the eval case that tests it          |

---

## 10. What you defer

- **The security of the application around the agent** — authentication,
  secrets, dependencies, the network edge:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Test strategy for the deterministic code** and the CI release gate:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- **Splitting the work of building something across agents**:
  [`technical-program-manager`](../technical-program-manager/SKILL.md). This
  expert designs agents as a product; it does not run or orchestrate them, and
  Forgeprint has no runtime that does
  ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).
