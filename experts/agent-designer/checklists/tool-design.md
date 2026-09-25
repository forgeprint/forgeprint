# Tool design

Run for every tool the model can call, whatever protocol carries it. A tool
definition is read by the model on every turn; it is a prompt, and it is held
to the same standard.

| #   | Check                                                                                                            | How                                                                         | Source                                      |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| TD1 | A tool inventory exists: one row per tool with what it reads, what it writes, the scope of each, and every error | the table is in the design spec; its rows match the registered tools        | Anthropic tools 2025; LLM06:2025            |
| TD2 | Tools are shaped around tasks, not one per API endpoint, and each one is justified                               | for each tool, name the task it serves; merge tools that serve the same one | Anthropic tools 2025                        |
| TD3 | Names say which system a tool belongs to and use only letters, digits, `_`, `-` and `.`                          | read the names                                                              | Anthropic tools 2025; MCP 2026-07-28, tools |
| TD4 | Inputs are typed: required fields listed, enums instead of free strings, `additionalProperties: false`           | read each input schema                                                      | MCP 2026-07-28, tools; Anthropic BEA 2024   |
| TD5 | Every error says what was wrong, what is accepted, and what to call instead                                      | call each tool with one bad argument and read what comes back               | MCP 2026-07-28, tools; Anthropic tools 2025 |
| TD6 | Responses are bounded: pagination, filtering or truncation, with defaults                                        | call each list or search tool with the widest input it accepts              | Anthropic tools 2025; LLM10:2025            |
| TD7 | Each tool reaches one scoped thing. No open-ended shell, no free-form query, no write to an arbitrary path       | read what each tool can reach; compare with TD1                             | LLM06:2025                                  |
| TD8 | Identifiers in responses are ones the model can use and a person can read                                        | read one response of each tool                                              | Anthropic tools 2025                        |
| TD9 | A change to a tool name, description or schema is run against the eval set like a prompt change                  | the change has a results file next to it                                    | Anthropic tools 2025; Anthropic evals 2026  |

## Why each one

**TD5 is the one that decides whether the agent recovers.** A model that gets
"invalid date: must be in the future, today is 2026-09-24" fixes the call on
the next turn. A model that gets a stack trace retries the same call, or gives
up, or makes something up.

**TD7** is the row an injection exploits. A tool that runs any shell command
hands whatever text reached the context — a web page, a document, another
tool's output — the same shell. Scope the tool, and an injected instruction
can only do what the tool was scoped to do.

**TD9** closes the loophole in the prompt rule. Tool descriptions steer the
model as strongly as the system prompt does, and editing one without running
the eval set is a prompt change that skipped its test.
