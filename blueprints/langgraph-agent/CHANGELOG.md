# Changelog — langgraph-agent

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
