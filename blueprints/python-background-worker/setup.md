# Setup

Creates a Celery worker with Redis as the broker, tests that run without one,
and a check that puts a real job through a real worker and reads the result
back.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.10 or newer and Docker.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   celery[redis]==5.6.3
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import celery"`

6. Create `app/__init__.py` with:

   ```python

   ```

   Verify: `test -f app/__init__.py`

7. Create `app/tasks.py` with:

   ```python
   """The worker: its configuration, and the tasks it runs.

   Every setting below is a decision about what happens when something goes
   wrong, which is the only interesting question a queue asks.
   """

   import os

   from celery import Celery

   BROKER_URL = os.environ.get("BROKER_URL")
   RESULT_BACKEND = os.environ.get("RESULT_BACKEND")

   # Read at import, so a worker with no broker fails to start rather than
   # starting and consuming nothing. A queue that is silently not connected
   # looks exactly like a queue with no work in it.
   if not BROKER_URL or not RESULT_BACKEND:
       raise RuntimeError("BROKER_URL and RESULT_BACKEND are required")

   app = Celery("worker", broker=BROKER_URL, backend=RESULT_BACKEND)

   app.conf.update(
       # Acknowledge after the task finishes, not when it is received. With
       # early acknowledgement — the default — a worker killed mid-task loses
       # the job silently. With late acknowledgement it is redelivered.
       task_acks_late=True,
       # And redeliver when the worker dies rather than when it fails: without
       # this, acks_late still drops the job if the process is killed.
       task_reject_on_worker_lost=True,
       # One task at a time per worker. The default prefetches four, which
       # means a slow task blocks three others that a free worker could have
       # taken.
       worker_prefetch_multiplier=1,
       # A task with no time limit is a worker that can be occupied forever.
       # The soft limit raises an exception the task can catch; the hard limit
       # kills it.
       task_time_limit=300,
       task_soft_time_limit=270,
       broker_connection_retry_on_startup=True,
       # Results are not a database. Expire them, or Redis grows without
       # bound and the failure arrives as an eviction during an incident.
       result_expires=3600,
   )


   class TransientFailure(Exception):
       """A failure worth retrying: a timeout, a 503, a lock held elsewhere.

       Retrying everything is how a bad input is attempted four times and a
       poison message lives forever. The exception type is the decision.
       """


   @app.task(
       bind=True,
       # An explicit name, so renaming the function does not orphan the jobs
       # already in the queue under the old dotted path.
       name="app.resize",
       autoretry_for=(TransientFailure,),
       retry_backoff=True,
       # Jitter, so a downstream outage does not produce a thundering herd of
       # retries arriving in lockstep.
       retry_jitter=True,
       max_retries=3,
       acks_late=True,
   )
   def resize(self, width: int, height: int) -> dict:
       if width <= 0 or height <= 0:
           # Not a TransientFailure: retrying bad input three times wastes a
           # worker and ends in the same place.
           raise ValueError("width and height must be positive")

       return {"width": width, "height": height, "area": width * height}
   ```

   Verify: `test -f app/tasks.py`

8. Create `tests/test_tasks.py` with:

   ```python
   """These run without a broker, on purpose.

   `.run()` calls the task body directly, so the logic is testable in
   milliseconds and in CI without a service. What it cannot prove is that the
   queue works — that is what the round-trip check at the end of this setup is
   for, and the two together are the point.
   """

   import pytest

   from app.tasks import TransientFailure, resize


   def test_computes_without_a_broker() -> None:
       assert resize.run(3, 4) == {"width": 3, "height": 4, "area": 12}


   def test_refuses_invalid_input() -> None:
       with pytest.raises(ValueError):
           resize.run(0, 4)


   def test_is_registered_under_an_explicit_name() -> None:
       # The name is part of the wire format. Renaming the function without
       # this would orphan every job already queued under the old path.
       assert resize.name == "app.resize"


   def test_retries_only_the_transient_failure() -> None:
       # The test that fails the day somebody adds Exception to the tuple and
       # turns a poison message into four attempts.
       assert TransientFailure in resize.autoretry_for
   ```

   Verify: `test -f tests/test_tasks.py`

9. Create `scripts/enqueue.py` with:

   ```python
   """Put one job through the real queue and read the result back.

   This is the check the unit tests cannot make: that a task reaches a worker
   through the broker, runs, and returns something the caller can read.
   """

   import sys

   from app.tasks import resize

   result = resize.delay(3, 4)
   value = result.get(timeout=60)

   if value != {"width": 3, "height": 4, "area": 12}:
       print(f"unexpected result: {value}", file=sys.stderr)
       raise SystemExit(1)

   print("round trip ok", file=sys.stderr)
   ```

   Verify: `test -f scripts/enqueue.py`

10. Create `pytest.ini` with:

    ```ini
    [pytest]
    testpaths = tests
    ```

    Verify: `test -f pytest.ini`

11. Create `compose.yaml` with:

    ```yaml
    services:
      redis:
        image: redis:8-alpine
        # Loopback, and a port the operating system chooses. 6379 is usually
        # already taken by whatever else on the machine wants Redis, and the
        # failure is a cryptic "port is already allocated".
        ports: ['127.0.0.1::6379']
        healthcheck:
          test: ['CMD', 'redis-cli', 'ping']
          interval: 2s
          retries: 15
    ```

    Verify: `test -f compose.yaml`

12. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    python.path
    broker.url
    worker.log
    worker.pid
    ```

    Verify: `test -f .gitignore`

13. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          redis:
            image: redis:8-alpine
            ports: ['6379:6379']
            options: >-
              --health-cmd "redis-cli ping"
              --health-interval 2s
              --health-retries 15
        env:
          BROKER_URL: redis://127.0.0.1:6379/0
          RESULT_BACKEND: redis://127.0.0.1:6379/1
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - run: pip install -r requirements-dev.txt
          - run: python -m pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

14. Create `README.md` with:

    ```markdown
    # worker

    A Celery worker with Redis as the broker.

    ## Run it

    `docker compose up -d --wait`, then set `BROKER_URL` and `RESULT_BACKEND`
    from `docker compose port redis 6379`, then
    `celery -A app.tasks worker --loglevel=info`.

    It refuses to start without both variables. That is deliberate: a worker
    that is silently not connected looks exactly like a queue with no work.

    ## Add a task

    See `AGENTS.md`. The short version: give it an explicit `name`, decide
    which exceptions are worth retrying, and test the body with `.run()`.
    ```

    Verify: `test -f README.md`

15. Run the unit tests. They need no broker, so the variables here are only what the module requires at import: `BROKER_URL="redis://127.0.0.1:6379/0" RESULT_BACKEND="redis://127.0.0.1:6379/1" "$(cat python.path)" -m pytest -q`
    Verify: `BROKER_URL="redis://127.0.0.1:6379/0" RESULT_BACKEND="redis://127.0.0.1:6379/1" "$(cat python.path)" -m pytest -q`

16. Remove a broker left behind by an earlier attempt: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q redis)"`

17. Start Redis and wait for it to answer: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q redis)"`

18. Ask Docker which host port it chose, and write the broker address once so every step below uses the same one: `docker compose port redis 6379 > broker.url`
    Verify: `test -s broker.url`

19. Start a worker against that broker and keep its process id. Two flags earn their place: the solo pool, because the default is a process pool that does not fork on Windows, and `--loglevel=info`, because "ready" is an info-level line and the next step waits for it: `BROKER_URL="redis://$(cat broker.url)/0" RESULT_BACKEND="redis://$(cat broker.url)/1" PYTHONPATH="$PWD" "$(cat python.path)" -m celery -A app.tasks worker --loglevel=info --pool=solo > worker.log 2>&1 & echo $! > worker.pid`
    Verify: `test -s worker.pid`

20. Wait until the worker says it is ready, rather than guessing at a sleep: `for attempt in $(seq 60); do grep -q "ready" worker.log && break; sleep 1; done`
    Verify: `grep -q "ready" worker.log`

21. Put a job through the queue and read the result back. This is the step the unit tests cannot replace: it proves the task reaches a worker through the broker and returns: `BROKER_URL="redis://$(cat broker.url)/0" RESULT_BACKEND="redis://$(cat broker.url)/1" PYTHONPATH="$PWD" "$(cat python.path)" scripts/enqueue.py`
    Verify: `BROKER_URL="redis://$(cat broker.url)/0" RESULT_BACKEND="redis://$(cat broker.url)/1" PYTHONPATH="$PWD" "$(cat python.path)" scripts/enqueue.py`

22. Stop the worker: `kill "$(cat worker.pid)"`
    Verify: `test -f worker.pid`

23. Stop the broker: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q redis)"`
