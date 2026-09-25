# LLM App Crew

_Assembled by @aliosmanmho_

Three experts for a feature built on a language model: a RAG pipeline, an
agent, or an LLM call inside an application. The designer starts from the
simplest thing that could work and makes every tool typed and scoped; the
security reviewer treats model output as untrusted input; the QA lead holds
every prompt change to an eval set with a recorded baseline.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                            | What it brings                                                                   | The question it asks first                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`agent-designer`](../../experts/agent-designer/SKILL.md)         | A workflow before an agent, typed tools, an eval set, the injection threat model | Does this need a model at all, and if so, does it need an agent |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)   | Trust boundaries and authorization, with the model on the untrusted side         | What can the model make a tool do that the user could not       |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md) | The evaluation harness as a gate, and a signal worth acting on                   | Would the eval notice if this prompt change made things worse   |

**Two checkers.** The security reviewer checks what the designer's tools allow;
the QA lead checks what the designer's prompts produce. The designer builds and
does not grade its own eval run.

There is no backend engineer. In this catalog those are per language; add the
one for your stack when the feature needs a service written around it.

## What they install

| Integration                                                 | Why this crew wants it                                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`context7-mcp`](../../integrations/context7-mcp/README.md) | SDK and framework documentation at the pinned version; model SDKs change faster than training data |
| [`exa-mcp`](../../integrations/exa-mcp/README.md)           | Vendor documentation and published attack write-ups the designer and the reviewer cite             |

Both send your query to a third-party service. Keep prompts, customer data and
keys out of a search query; read each README first.

## The order they are useful in

1. **Agent designer first**: the simplest design, the tools with their types
   and scopes, the eval set, and a baseline run recorded before any prompt is
   tuned.
2. **Security reviewer second**, on the tools and the data paths: indirect
   prompt injection through retrieved content, and excessive agency through
   tools that can do more than the task needs.
3. **QA lead third**, turning the eval set into a gate: fixed inputs, stated
   thresholds, repeated runs where output varies, and a red build that means
   the change goes back.

They disagree in two places, and the disagreement is useful:

- The designer can reduce injection by what the model is told; the reviewer
  assumes the model can be told anything and checks what the tools let it do.
  The durable fix is in the tool's permissions, not in the prompt.
- The QA lead wants deterministic checks; model output varies. Resolve it with
  fixed inputs, pinned model versions, and thresholds over repeated runs — not
  by deleting the cases that flake.

## Why three

- Anthropic's own guidance on building agents is to find the simplest solution
  and add complexity only when needed. The same holds for the crew: one
  builder and two checkers.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification and
  a verification step worth +15.6%. Here verification is the eval gate and the
  tool review.
- Kim et al. measured errors amplified 17.2 times across independent agents.
  The design is coupled, so it has one owner.

## Where this crew is wrong

- **Model training, or a classic machine-learning pipeline.** No member here
  trains a model.
- **A single prompt tweak on a feature that already has an eval set.** Small,
  sequential work: take the agent designer alone and run the eval.

## How to use it

Ask your agent for the crew by name and do not write a prompt until the eval
set and its baseline exist as files.
