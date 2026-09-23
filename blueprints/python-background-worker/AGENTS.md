# Python Background Worker — agent context

A Celery worker with Redis as the broker. Read this before adding a task.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/tasks.py        the Celery app, its settings, and the tasks
tests/test_tasks.py the task bodies, run with .run() and no broker
scripts/enqueue.py  one job through the real queue, result read back
compose.yaml        Redis, on a port the operating system chooses
```

## Rules that are not style preferences

**Give every task an explicit `name`.** The name is on the wire. Rename the
function without it and every job already queued under the old dotted path is
orphaned — they fail as unregistered tasks, after the deploy, in production.

**Decide which exceptions retry.** `autoretry_for=(TransientFailure,)` is the
decision: a timeout or a 503 is worth another attempt, a bad argument is not.
Retrying everything turns one poison message into four, and a test asserts the
tuple so that adding `Exception` to it fails.

**`acks_late` with `task_reject_on_worker_lost`.** The default acknowledges on
receipt, so a worker killed mid-task loses the job silently. Late
acknowledgement redelivers it — but only with the second setting, or a killed
process still drops it. They are one decision in two lines.

**`worker_prefetch_multiplier=1` unless you know better.** The default
prefetches four, so a slow task blocks three others that a free worker could
have taken.

**Both time limits.** A task with no limit is a worker that can be occupied
forever. The soft limit raises something the task can catch; the hard one kills
it.

**`result_expires`.** Results are not a database. Without expiry Redis grows
until it evicts something, and it will not be the thing you would have chosen.

**The configuration is read at import and the module refuses without it.** A
worker with no broker starts and consumes nothing, which looks exactly like a
queue with no work in it. That is a bad afternoon.

## Testing in two halves

`.run()` calls the task body directly: no broker, no worker, milliseconds. That
covers the logic and cannot cover the queue.

`scripts/enqueue.py` covers the queue: a real job, a real worker, the result
read back. It is slower and it is the only thing that proves a task is
registered, reachable and serialisable.

Write both. A suite with only the first passes while the broker settings are
wrong; a suite with only the second is too slow to run often.

## Adding a task

1. Write it in `app/tasks.py` with an explicit `name`.
2. Decide the retry policy: which exception type, how many attempts, backoff
   with jitter.
3. Keep the arguments small and serialisable — they travel as JSON. Pass an
   identifier, not an object.
4. Add a `.run()` test for the body and a case for the input it should refuse.

## What this does not do

No result storage beyond Redis with an expiry, no periodic tasks (Celery Beat),
no chains or groups, no dead-letter handling, no monitoring (Flower), no
database. The worker computes and returns; anything that has to survive is your
decision.

RabbitMQ is the other common broker and is not set up here. It changes the
delivery guarantees, not the task code.
