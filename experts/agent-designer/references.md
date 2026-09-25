# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days** — and sooner for this expert: the MCP
specification published a new revision within eight months of the last one,
and the Agent Skills specification carries no version number at all.

> **Next re-check due: 2026-12-23.**

## Protocols and formats

| Short name        | Reference                                                                                        | Version                                                                                                         | Checked    | Used for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP 2026-07-28    | [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2026-07-28) | revision **2026-07-28**; the previous revision is 2025-11-25                                                    | 2026-09-24 | **Tools**: name rules, `inputSchema` as a valid JSON Schema object, `outputSchema` and `structuredContent`, the split between protocol errors and `isError` execution errors, stateful tools as explicit handles, and the server MUSTs — validate inputs, control access, rate limit, sanitise outputs. **Schema**: `ToolAnnotations` and its defaults (`destructiveHint` and `openWorldHint` default `true`). **Overview**: annotations from an untrusted server are untrusted. **Changelog**: sessions and the initialize handshake removed; state moves to handles. §5, TD3–TD5, MS1–MS7, MS11, IA5, IA8 |
| Agent Skills spec | [Agent Skills specification](https://agentskills.io/specification)                               | **unversioned**; the specification page last changed 2026-08-04 (commit `217be54` in `agentskills/agentskills`) | 2026-09-24 | `name` 1–64 characters, lowercase, matching the folder; `description` at most 1,024 characters saying what and when; progressive disclosure, a body under 500 lines, references one level deep. §6, SK1–SK3. Because it has no version, cite it with the check date                                                                                                                                                                                                                                                                                                                                         |

## How agents, tools and skills are built

| Short name               | Reference                                                                                                                          | Version                                     | Checked    | Used for                                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic BEA 2024       | [Anthropic, _Building effective agents_](https://www.anthropic.com/engineering/building-effective-agents)                          | 2024-12-19                                  | 2026-09-24 | The ladder in §1: find the simplest solution and add complexity only when needed; workflows (prompt chaining, routing, parallelisation, orchestrator-workers, evaluator-optimizer) against agents. Poka-yoke in tool design: change the arguments so mistakes are harder. SD1–SD4, TD4 |
| Anthropic MA 2025        | [Anthropic, _How we built our multi-agent research system_](https://www.anthropic.com/engineering/multi-agent-research-system)     | 2025-06-13                                  | 2026-09-24 | Agents use about 4× the tokens of chat and multi-agent systems about 15×; tasks with shared context or many dependencies, including most coding, are a poor fit. §1 rung 4, SD5                                                                                                        |
| Anthropic tools 2025     | [Anthropic, _Writing effective tools for AI agents — with agents_](https://www.anthropic.com/engineering/writing-tools-for-agents) | 2025-09-11                                  | 2026-09-24 | Fewer task-shaped tools over endpoint wrappers, namespacing, meaningful identifiers, pagination and truncation, helpful errors, tool descriptions as prompts, and a held-out test set against overfitting. §4, TD1–TD3, TD5, TD6, TD8, TD9, EV7                                        |
| Anthropic evals 2026     | [Anthropic, _Demystifying evals for AI agents_](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)            | 2026-01-09                                  | 2026-09-24 | Tasks, trials, graders and transcripts; code, model and human graders; `pass@k` against `pass^k`; capability and regression evals; start with 20–50 tasks from real failures, with reference solutions; read the transcripts. §2, §3, SD2, EV1–EV6, EV8, EV10                          |
| Anthropic skills BP      | [Anthropic, _Skill authoring best practices_](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)    | unversioned documentation, current at check | 2026-09-24 | Build evaluations first: three scenarios and a baseline without the skill; description in the third person with triggers; feedback loops; run-or-read for scripts; fully qualified MCP tool names; test with every model you plan to use. §6, SK2–SK9                                  |
| Forgeprint expert-author | [`skills/expert-author`](../../skills/expert-author/SKILL.md)                                                                      | this repository                             | 2026-09-24 | The bar for an instruction: can the agent verify it obeyed it. SK4                                                                                                                                                                                                                     |

## Eval harnesses

The expert names no required harness. These are the two it was checked
against, as examples of a configuration and a results log somebody else can
rerun (EV9).

| Short name        | Reference                                                                             | Version                            | Checked    | Used for                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| promptfoo 0.123.1 | [promptfoo](https://www.promptfoo.dev/docs/intro/) — npm `promptfoo`                  | 0.123.1, published 2026-09-18, MIT | 2026-09-24 | A YAML configuration of prompts, test cases and assertions, deterministic and model-graded, with side-by-side results and CI use |
| Inspect 0.3.268   | [Inspect](https://inspect.aisi.org.uk/), UK AI Security Institute — PyPI `inspect-ai` | 0.3.268, published 2026-09-22, MIT | 2026-09-24 | Datasets, solvers and scorers, with eval logs that keep every transcript                                                         |

## Tracked in `docs/review-standards.md`

These are the catalog's security references. Their full rows — link, version,
what they cover — live in [`docs/review-standards.md`](../../docs/review-standards.md)
and are not copied here; two copies of a standard is one copy that is wrong.
This expert re-read the parts it cites on the date shown.

| Short name       | Row in `docs/review-standards.md`                       | Re-read    | Parts cited                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LLM01–LLM10:2025 | OWASP Top 10 for LLM Applications, 2025 edition         | 2026-09-24 | LLM01 Prompt Injection (direct and indirect; segregate external content, privilege control, adversarial testing), LLM05 Improper Output Handling, LLM06 Excessive Agency (functionality, permissions, autonomy), LLM07 System Prompt Leakage ("not a secret, nor a security control"), LLM10 Unbounded Consumption |
| MCP security BP  | MCP specification — security best practices, 2026-07-28 | 2026-09-24 | Token passthrough (MUST NOT accept tokens not issued for the server), state handle hijacking, scope minimization, local MCP server compromise. MS6, MS8–MS10                                                                                                                                                       |

## Deferred to elsewhere

- The security of the application around the agent:
  [`security-reviewer`](../security-reviewer/SKILL.md), against the whole of
  `docs/review-standards.md`, including the OWASP Top 10 for Agentic
  Applications.
- Test strategy for deterministic code and the release gate:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- Splitting the work of building something across agents:
  [`technical-program-manager`](../technical-program-manager/SKILL.md), and
  [ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md) on why there
  is no runtime.
