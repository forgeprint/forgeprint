# Changelog — python-background-worker

## 1.1.0 — 2026-09-24

What the broker actually is, from the architecture review
([2026-09-23](../../docs/reviews/python-background-worker/2026-09-23.md),
findings 1 and 2).

Celery has no authentication of its own: anything that can write to the broker
can run any registered task with any arguments. The shipped configuration is
`redis://localhost` and is fine, and the blueprint never said **why** it was
fine — so nothing marked the moment that reasoning stops holding.

- **`AGENTS.md` gained a section of its own**, before the rules rather than
  among them, because it is the trust boundary and not a setting. It names the
  three controls a shared broker needs: a password and TLS (`rediss://`), a
  network only the producers are on, and validation inside the task.
- **It closes finding 2 in the same paragraph.** Task arguments arrive from the
  broker, so they are input in the sense every other input is.

The framing is deliberate: this is not about a stolen password. It is about a
shared broker acquiring a second producer that nobody meant to give
task-execution rights to.

No change to the recipe or the code.

## 1.0.0 — 2026-09-23

First version, and the catalog's first `data` blueprint.

A Celery 5.6 worker with Redis as the broker, where the retry policy and the
acknowledgement behaviour are decided explicitly rather than inherited, and
where a check puts a real job through a real worker and reads the result back.

It fills `background-jobs` — a requirement that had been in the taxonomy since
the first week with nothing behind it.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where
`data` was empty and `celery` showed 42.6M downloads a month. Its recipe runs
in CI like every other and nobody has run a worker on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

The settings are the blueprint. `acks_late` with `task_reject_on_worker_lost`,
because either alone still drops a job when the process is killed;
`worker_prefetch_multiplier=1`, because the default lets a slow task block
three others; both time limits; `result_expires`, because results are not a
database and Redis will otherwise evict something you did not choose. Each one
carries the failure it prevents.

Found by running it: `--loglevel=warning` never prints the "ready" line the
setup waits for, so the worker starts and the step times out looking for a
message that is info-level. The recipe now says why the flag is what it is.
