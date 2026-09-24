# LangGraph Agent — agent context

An agent on LangGraph. Read this before adding a tool. The tool is where the
security of this program lives.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/tools.py               what the agent can do, and what it refuses
app/graph.py               build_graph(model, notes_root): nodes, routing, the bound
tests/test_tools.py        the refusals
tests/test_graph.py        the whole graph, with a fake model
scripts/check_boundary.py  the escape check, outside the test suite
```

## The rule that matters more than the rest

**A tool takes the narrowest argument that can express the job.** Not a path —
a name. Not a URL — an identifier. Not SQL — parameters.

The model chooses those arguments, and the model is influenced by everything in
the conversation: a fetched page, a pasted email, a file somebody else wrote.
So the arguments are attacker-influenced by default, and the tool has to refuse
in code what a prompt could otherwise talk it into (OWASP LLM 2025, excessive
agency; OWASP Agentic 2026).

`read_note` checks the shape of the name _and_ the resolved path, because
either alone has a hole: `../` is easy to reject before resolving, and a
symlink inside the directory is only visible after.

## Other rules that are not style preferences

**A refusal is a message, not an exception.** `ToolRefused` is caught in the
tool node and turned into a `ToolMessage`. The model reads it and says so; the
process does not die mid-conversation. An agent that crashes on a refused tool
call is an agent that cannot be trusted with a tool that ever refuses.

**Bound the loop.** `MAX_TOOL_CALLS` exists because an agent that can loop can
loop forever, and the bill arrives either way. Every conditional edge back into
the assistant needs a counter and a limit.

**Bound the output.** A tool that can return an unbounded amount of text can
fill a context window. `MAX_BYTES` is that bound.

**The model is a parameter, not an import.** `build_graph(model, notes_root)`
is what makes the tests possible: they pass a fake model and drive the real
graph. A module that built its own client from the environment could only be
tested with an API key — which means, in practice, it would not be tested.

**No provider package is installed here**, and a step checks that it is not.
Which provider you use is your decision; the blueprint stays out of it.

## Adding a tool

1. Write it in `app/tools.py` as a plain function taking the narrowest
   arguments that work.
2. Write the refusals first, and make them raise `ToolRefused`.
3. Test the refusals before the happy path. A test that only proves the tool
   works for the caller you trust proves nothing about the caller you do not.
4. Bound anything unbounded: size, count, time.
5. Register it in the tool node and give the model a description that says what
   it will refuse, not only what it does.
6. **Ask whether it needs a person.** A tool that writes, spends, sends or
   deletes does; reading a note does not. The checkpoint is
   `interrupt_before=["tools"]` on `graph.compile()`, which needs a
   checkpointer so the graph can stop and be resumed, and a caller that invokes
   with a thread id and calls `invoke(None, config)` once somebody has
   approved. `build_graph` carries it commented out, at the line it goes on.

The refusals in step 2 bound what a tool may do. Step 6 is the other half:
refusals are decided when the tool is written, and the checkpoint is decided
when the tool runs. A tool whose blast radius depends on its arguments — a
payment, a delete, an email — cannot be made safe by refusals alone, because
the arguments are the model's.

## What this does not do

No persistence between runs, no checkpointer, no streaming, no observability,
no rate limiting, no cost accounting, no system prompt. `MAX_TOOL_CALLS` bounds
a single invocation and nothing bounds how many invocations happen.

There is no human-in-the-loop interrupt either, because the one tool here reads
a file. The line it goes on is in `build_graph`, commented, and step 6 of
"Adding a tool" says when it stops being optional.

There is also no defence against prompt injection beyond the tool boundary, and
that is deliberate: the tool boundary is the only defence that works. Filtering
the text is a losing game; refusing the action is not.
