# Process lifecycle

What the process builds when it starts, how it retries while it runs, and what
it does in the seconds between SIGTERM and SIGKILL.

| #   | Check                                                                                                   | How                                                                          | Source                                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| PL1 | Engines and HTTP clients are created in the `lifespan` handler and disposed there                       | read the lifespan; grep module scope for `create_engine(` and `AsyncClient(` | FastAPI 0.141 — Lifespan Events                            |
| PL2 | uvicorn runs with `--timeout-graceful-shutdown` set below the pod's `terminationGracePeriodSeconds`     | read the start command and the deployment manifest                           | Uvicorn 0.53 — settings; Kubernetes 1.37 — pod termination |
| PL3 | Readiness fails as soon as shutdown starts, so no new traffic is routed during the drain                | send SIGTERM; poll `/health/ready`                                           | Kubernetes 1.37 — container probes                         |
| PL4 | `/health/live` touches no dependency; `/health/ready` runs a query through the pool                     | stop the database; live stays 200, ready turns 503                           | Kubernetes 1.37 — container probes                         |
| PL5 | The container runs the server process directly, so SIGTERM reaches it                                   | read the Dockerfile `CMD`; no shell wrapper that swallows signals            | The Twelve-Factor App — IX Disposability                   |
| PL6 | Retries use tenacity with `stop_after_attempt`, `wait_exponential_jitter` and `retry_if_exception_type` | read each `@retry`; a bare `@retry` retries forever on everything            | tenacity 9.1 — API                                         |
| PL7 | Only idempotent calls are retried, or calls carrying an idempotency key                                 | read what each retried function does                                         | RFC 9110 §9.2.2                                            |
| PL8 | Retries stay inside the request's deadline                                                              | the retry's total wait is less than the timeout of the caller                | Python 3.14 — asyncio.timeout                              |
| PL9 | The Python version is pinned in `pyproject.toml` and the image, and matches CI                          | read `requires-python`, the base image tag and the CI matrix                 | Python 3.14 — release status                               |

## Why each one

**PL2** is a default that means "forever". Without the option, uvicorn waits
for every in-flight request; a single slow one outlasts the grace period and
the orchestrator sends SIGKILL, dropping every other request mid-response.

**PL6** is aimed at tenacity's own default. `@retry` with no arguments retries
on any exception, immediately and without limit — a tight loop against the
dependency that is already failing.

**PL1** keeps the process restartable in tests and in production alike. A
client created at import time is created once per interpreter, outlives the
event loop that owned it, and warns or fails on shutdown.
