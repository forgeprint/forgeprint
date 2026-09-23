# LangGraph Agent

An agent on LangGraph with one narrow tool, a bounded loop, and tests that
drive the whole graph with a fake model — so the behaviour is verified without
an API key.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run it against a real model,
which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- An agent that has to touch something real — files, a database, an internal
  API — where the interesting question is what it is allowed to do rather than
  how it phrases an answer.
- A team that wants agent behaviour under test. Most agent code is untested
  because testing it looks like it needs a key and a budget; it does not, and
  this shows the shape.
- Learning where the boundary goes. The tool is the security of the program,
  and this blueprint is mostly an argument for that one sentence.
- Anything that will later be reviewed: the refusals are code, so they can be
  read, tested and argued with.

## What it is NOT for

- **Choosing a model provider.** No `langchain-openai`, no
  `langchain-anthropic`. `build_graph` takes the model as a parameter, and a
  step in the setup confirms no provider package is installed.
- **Conversation state.** No checkpointer, no thread persistence. Each
  invocation starts empty.
- **Human-in-the-loop.** LangGraph supports interrupts; this does not use them,
  and any tool with real consequences should have one.
- **Streaming, observability or cost accounting.** Nothing reports tokens,
  latency or spend, and an agent is the kind of program where that matters
  sooner than usual.
- **Many tools.** One, deliberately. The shape of adding the second is in
  `AGENTS.md`; the blueprint does not pretend to show an ecosystem.
- **Defending against prompt injection by filtering text.** It does not try,
  because that does not work. See below.

## Pros

- **It is tested, without a key.** A fake model drives the real graph: the
  routing, the tool node, the bound. The model's own judgement is not what
  needs testing — the graph is — and a fake makes the suite instant, free and
  deterministic. A step then confirms no provider package is installed, so the
  claim is checked rather than asserted.
- **The tool refuses in code.** `read_note` takes a name, not a path; it checks
  the shape before resolving and the resolved path after, because either alone
  has a hole — `../` is easy to reject early, and a symlink inside the
  directory is only visible late. Five refusal cases are tested before the
  happy path.
- **A refusal is a message.** The model reads "refused: …" and answers
  accordingly; the process does not die mid-conversation. An agent that crashes
  on a refused tool call cannot be given a tool that ever refuses.
- **The loop is bounded**, and the comment says why: an agent that can loop can
  loop forever, and the bill arrives either way.
- **The output is bounded.** A tool that can return unlimited text can fill a
  context window.
- **The escape check exists outside the test suite** and runs as a setup step,
  so it survives somebody deleting a test file.
- **The model is a parameter**, which is the single decision that makes all of
  the above possible.

## The argument it is making

Every other defence against prompt injection is a filter, and filters lose. The
text reaching a model comes from pages, emails and files that somebody else
wrote, and the model will be talked into asking for something eventually.

So the position here is that **the tool boundary is the only defence that
works**: not "detect the injection", but "make the action impossible". A tool
that cannot express `../` cannot be talked into it, however persuasive the
prompt. That is why the tool takes a name instead of a path, and why most of
this blueprint is about fifteen lines of validation.

## Cons

- **Nobody has run it against a real model.** See the notice above. In
  particular, no real model has been observed choosing to call this tool, which
  is the part a fake cannot rehearse.
- **One tool that reads a file.** Real agents write, call APIs and spend money,
  and each of those needs a human-in-the-loop interrupt that this does not
  show.
- **`GenericFakeChatModel` is a test double, not a model.** It returns what you
  queue. It proves the graph routes and the tool refuses; it proves nothing
  about whether a real model would produce a sensible tool call.
- **No system prompt.** A real agent needs one, and where it lives — and what
  it is allowed to say about the tools — is a design decision left open.
- **No cost or rate bound across invocations.** `MAX_TOOL_CALLS` bounds one
  run. Nothing bounds how many runs happen.
- **LangGraph moves quickly.** Pinned versions protect the recipe and mean a
  real upgrade eventually.

## Compared with the alternatives here

- **`python-mcp-server`**, **`ts-mcp-server`**, **`dotnet-mcp-server`** — the
  other three `agent` blueprints, and all of them build the _server_ side: a
  tool surface for somebody else's agent to call. This is the caller. If you
  are exposing capability to Claude Code or another host, use one of those; if
  you are writing the thing that decides, use this.
