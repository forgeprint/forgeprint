# Queue boundaries

A queued job is a serialised message read by another process, later,
possibly more than once. Laravel's queue settings decide which of those
facts bite.

| #   | Check                                                                                        | How                                                                                 | Source                                        |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| QB1 | Job constructors take identifiers or models with `SerializesModels`, not stateful objects    | read each class implementing `ShouldQueue`                                          | Laravel 13 — queues: class structure          |
| QB2 | Jobs dispatched inside a transaction run after commit                                        | `after_commit => true` in `config/queue.php`, or `->afterCommit()` at dispatch      | Laravel 13 — queues: jobs and transactions    |
| QB3 | Worker `--timeout` (or `#[Timeout]`) is several seconds below the connection's `retry_after` | compare the worker command and job timeouts with `config/queue.php`                 | Laravel 13 — queues: job expiration           |
| QB4 | Each job is safe to run twice, and says how                                                  | `ShouldBeUnique`, `WithoutOverlapping`, or an idempotency key named in the docblock | Laravel 13 — queues: unique jobs, middleware  |
| QB5 | Tries and backoff are set per job, not left to the worker default                            | `#[Tries]`/`$tries` and `#[Backoff]`/`backoff()` on each job                        | Laravel 13 — queues: max attempts, backoff    |
| QB6 | Failed jobs are stored and a `failed()` method handles the final failure                     | the failed-jobs table migration exists; grep `function failed(`                     | Laravel 13 — queues: dealing with failed jobs |
| QB7 | A job carrying personal or secret data is encrypted                                          | `ShouldBeEncrypted` on those job classes                                            | Laravel 13 — queues: encrypted jobs           |

## Why each one

**QB2** because the default for every connection in the Laravel skeleton is
`after_commit => false`. A job dispatched inside `DB::transaction()` goes onto
the queue immediately; a fast worker picks it up, looks for the row, and finds
nothing — or finds it and then the transaction rolls back.

**QB3** is written in Laravel's documentation as a warning: if the timeout is
longer than `retry_after`, the connection hands the job to a second worker
while the first is still running it. The symptom is a customer charged twice.

**QB4** is what makes QB3's failure harmless when it happens anyway, and it
will: a worker killed mid-job is retried by design.
