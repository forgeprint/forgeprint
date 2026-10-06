<!--
Round 2, D3 — splitting with the principles. As D2, plus the expert.

Install the `technical-program-manager` expert into the run directory before
the run; the prompt names it, and the expert must be loadable or the run is D2
with a longer prompt. `run.sh` does this, and says so in its output.

Paste the block below as the first and only prompt. Everything after it is an
answer to a question the agent asked, or it is an intervention and goes in the
record — except the one reply in `reply.md`, which fires on a mechanical
condition and is recorded as such.
-->

Starting from this project, add four resources — `projects`, `notes`, `tags`
and `budgets` — each with create, read, list and delete, input validation, and
tests for every route including the refusals. Every new route requires a token.

The fields: a project has `name` (text) and `archived` (true/false, optional).
A note has `title` and `content` (text) and `pinned` (true/false, optional). A
tag has `label` (text). A budget has `name` (text) and `limit` (a number).

You may split the work across subagents. Apply the
`technical-program-manager` expert while you do.

Tell me when you are done.
