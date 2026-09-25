# Simplest design

Run before anything is built, and again whenever somebody proposes adding a
rung. Every row is a sentence in the design spec or a result on disk.

| #   | Check                                                                                                               | How                                                            | Source                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| SD1 | The design spec names the rung chosen — one call, workflow, one agent, several agents — and the rung below it       | read the spec; both are named                                  | Anthropic BEA 2024                       |
| SD2 | The rung below was run against the eval set, and the result that ruled it out is recorded                           | the results file for that run exists                           | Anthropic BEA 2024; Anthropic evals 2026 |
| SD3 | Every step whose path is known in advance is code, not a model choice                                               | list the steps; mark which the model decides; justify each one | Anthropic BEA 2024                       |
| SD4 | An agent loop has a stopping condition: a maximum number of turns and a budget                                      | find both in the configuration, not in the prompt              | Anthropic BEA 2024; LLM10:2025           |
| SD5 | Several agents are chosen only for work that is wide and needs little shared context, with the token cost estimated | the spec states the parallel width and a cost estimate         | Anthropic MA 2025                        |
| SD6 | Every destructive or outbound step names the point where a human approves it                                        | read the spec; each such step has an approval point            | LLM06:2025                               |

## Why each one

**SD2 is the row that saves the most.** Without it, "we need an agent" is a
feeling, and the agent is kept because it was built. With it, the lower rung
either passes — and the agent is never built — or its failure is written down
and becomes the first cases in the eval set.

**SD3** is where most agent designs quietly overspend. A step whose order is
known before the run starts is a function call; handing it to the model adds
variance and buys nothing.

**SD5** exists because the cost is large and the benefit narrow. The published
measurement is about fifteen times the tokens of a chat, and the same source
says most coding tasks do not parallelise well enough to repay it.
