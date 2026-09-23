# Python Background Worker

A Celery worker with Redis as the broker, where the retry policy and the
acknowledgement behaviour are decided explicitly, and where the setup puts a
real job through a real worker and reads the result back.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a real worker on it first,
which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- The work that should not happen inside a request: resizing, exporting,
  sending, reconciling.
- A Python service that already exists and now needs a second process.
- A team that has a queue and does not know what happens when a worker is
  killed mid-task — because the answer is a setting, and the default is the
  one people regret.
- Learning the failure modes. Every setting in `app/tasks.py` carries the
  failure it prevents, in a comment beside it.

## What it is NOT for

- **Scheduled work.** No Celery Beat, no cron. Periodic tasks change the
  deployment shape because something has to hold the schedule.
- **Workflows.** No chains, groups, chords or canvas. A task that must run
  after another is a design decision, not a configuration.
- **Dead-letter handling.** After the retries are exhausted the task fails and
  the failure is in the result backend until it expires. Where a poison message
  should end up is your decision.
- **Monitoring.** No Flower, no metrics, no structured logging. In production
  you will want to know queue depth, and nothing here reports it.
- **A database.** The worker computes and returns. Anything that has to survive
  the result expiry needs somewhere to live.
- **RabbitMQ.** The other common broker, with different delivery guarantees.
  Not set up here, and the task code would not change.

## Pros

- **The queue is actually exercised.** The setup starts a worker, enqueues a
  job, and reads the result back. Unit tests on a Celery task prove the
  function works; only this proves the task is registered, reachable and
  serialisable.
- **The tests are the other half, and they need no broker.** `.run()` calls the
  body directly, so the logic is covered in milliseconds and in CI without a
  service. Both halves, on purpose — a suite with only the first passes while
  the broker settings are wrong.
- **Every setting has a reason written beside it.** `acks_late` with
  `task_reject_on_worker_lost` because either alone still drops a job when the
  process is killed. `worker_prefetch_multiplier=1` because the default lets a
  slow task block three others. Both time limits. `result_expires`, because
  Redis will otherwise evict something you did not choose.
- **The retry policy is a decision, not a default.** `autoretry_for` names one
  exception type, and a test asserts the tuple — so adding `Exception` to it,
  which turns a poison message into four attempts, fails.
- **Tasks have explicit names**, so renaming a function does not orphan the
  jobs already queued under the old dotted path.
- **The worker refuses to start without a broker.** A worker that is silently
  not connected looks exactly like a queue with no work in it.
- **Redis binds to loopback on a chosen port**, so it neither collides with an
  existing Redis nor listens on the network.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **Redis as a broker loses messages in ways RabbitMQ does not.** It is the
  common choice and the right starting point; it is not the durable one, and
  `acks_late` mitigates rather than solves it.
- **One task, and it multiplies two numbers.** You are meant to delete
  `resize`. What is worth keeping is the decorator and the settings above it.
- **`--pool=solo` in the setup** because the default pool does not fork on
  Windows. That is a check-only concession: in production you want the default
  prefork pool, and nothing here says how to size it.
- **No answer for a poison message.** After three retries the task fails and
  that is the end of the story the blueprint tells.
- **The result backend and the broker are the same Redis**, on different
  databases. Fine to start; a busy queue and a result store competing for the
  same instance is a real problem later.

## Compared with the alternatives here

Nothing else in this catalog is `data`, and nothing else carries
`background-jobs` — this is the first of both. `fastapi-service` is the nearest
neighbour and the natural pairing: an API that accepts work and a worker that
does it are usually the same deployment, and the split between them is exactly
what this blueprint is about.
