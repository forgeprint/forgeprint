# Changelog — langgraph-agent

## 1.1.0 — 2026-09-24

Where the human checkpoint goes, from the architecture review
([2026-09-23](../../docs/reviews/langgraph-agent/2026-09-23.md), finding 1).

The review called this the single most valuable addition the blueprint could
take, and the reason is what gets copied rather than what ships: the tool here
reads a file, so it needs no approval, and the next tool somebody writes into
this shape will not read a file.

- **`build_graph` carries `interrupt_before=["tools"]` commented out**, on the
  line it goes on, with the checkpointer it requires and the resume call the
  caller has to make. A reader who needs it finds it where they are already
  looking instead of in someone else's documentation.
- **"Adding a tool" gained a sixth step** — ask whether the tool needs a
  person — and says why refusals are not enough on their own: refusals are
  decided when the tool is written, and the arguments belong to the model.
- **"What this does not do" no longer just lists the absence.** It says which
  line closes it.

No behaviour changed and no step was added. The recipe produces the same
working agent it did in 1.0.0.

## 1.0.0 — 2026-09-23

First version, and the catalog's first `agent` blueprint that is not an MCP
server — the first that builds the thing on the other end.

An agent on LangGraph 1.2 with one narrow tool, a bounded loop, and tests that
drive the whole graph with a fake model.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), which put
this last on purpose: it is the highest-value and highest-risk blueprint in the
set, because it is the first one that ships a real tool surface. Its recipe
runs in CI like every other and nobody has run it against a real model, so it
is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

The open question was how to verify an agent without an API key. The answer is
that the model's judgement is not what needs testing — the graph is. A fake
model drives the real routing, the real tool node and the real bound, with no
key, no network, no cost and no flakiness, and a step confirms no provider
package is installed so the claim is checked rather than asserted.

The security position is one sentence: **the tool boundary is the only defence
that works.** Filtering text for prompt injection is a losing game; refusing
the action is not. So `read_note` takes a name rather than a path, checks the
shape before resolving and the resolved path after — either alone has a hole —
bounds the size it will return, and turns every refusal into a message the
model can read rather than an exception that kills the process.
