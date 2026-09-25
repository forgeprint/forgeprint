# Injection and agency

Run on the design, before the tools are built, and again whenever a tool or a
source of text is added. This is the agent's own threat model; the security of
the application around it belongs to
[`security-reviewer`](../../security-reviewer/SKILL.md).

| #    | Check                                                                                                       | How                                                                         | Source                                               |
| ---- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| IA1  | Every source of text that reaches the context is listed and marked trusted or untrusted                     | the threat model has one row per source: user, documents, web, tool results | LLM01:2025                                           |
| IA2  | Untrusted content is marked as such where it enters the context, not mixed into instructions                | read how retrieved text and tool results are inserted                       | LLM01:2025                                           |
| IA3  | For each tool, the threat model says what an injected instruction could make it do                          | one row per tool; the answer matches the scope in the tool inventory        | LLM01:2025; LLM06:2025                               |
| IA4  | No open-ended tool; each has the least permission that works and runs as the user, not as a service account | compare each tool's reach with its task                                     | LLM06:2025                                           |
| IA5  | Destructive and outbound actions need a human's approval, enforced in code                                  | try one without approval; it is refused                                     | LLM06:2025; MCP 2026-07-28, tools — user interaction |
| IA6  | Model output is validated and encoded before it reaches a shell, a query, a URL or a renderer               | follow each output to its sink                                              | LLM05:2025                                           |
| IA7  | The system prompt holds no secret and no rule that must hold; those are enforced outside the model          | read the system prompt; for each rule, find its enforcement in code         | LLM07:2025                                           |
| IA8  | Tool descriptions and annotations from another server are treated as untrusted                              | read how the client uses them                                               | MCP 2026-07-28, overview — tool safety               |
| IA9  | Tool calls are logged, and consumption has limits: turns, tokens, calls per tool                            | find the log and the limits                                                 | LLM06:2025; LLM10:2025                               |
| IA10 | Injection cases are in the eval set and run on every prompt change                                          | the eval set has cases tagged for injection                                 | LLM01:2025                                           |

## Why each one

**IA3 is where the design is decided.** Indirect injection cannot be filtered
out reliably; what can be decided is what a successful one is able to do. An
agent that reads the web and can only summarise is a nuisance when injected.
The same agent with a tool that sends email is a leak.

**IA5** is specific about "in code". A system prompt that says "always ask
before deleting" is a request the model may be talked out of. A tool that
refuses without an approval token is not.

**IA7** is the one teams resist, because the system prompt feels private. It
is not: it can be extracted, and even when it is not, its guardrails can be
worked out by probing. A rule that matters lives where the model cannot
negotiate with it.

**IA10** keeps the defences honest over time. Without injection cases in the
eval set, a prompt change that weakens one ships as an improvement.
