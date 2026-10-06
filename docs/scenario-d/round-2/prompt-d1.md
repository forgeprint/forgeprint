<!--
Round 2, D1 — the baseline. One agent, no subagents.

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

Tell me when you are done.
