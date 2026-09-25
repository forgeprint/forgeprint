# Lifecycle

How the process starts, how long it waits, how it retries, and how it stops.
Each row is tested by doing the thing: send the signal, kill the dependency,
slow the upstream.

| #   | Check                                                                                                                     | How                                                                    | Source                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| LC1 | Every outbound `fetch` passes a `signal` built with `AbortSignal.timeout`                                                 | grep `fetch(`; each call has `signal`                                  | Node.js 24 — AbortSignal.timeout; undici — Client timeouts               |
| LC2 | The request's own abort signal is combined in, so a disconnected client cancels the work                                  | grep `AbortSignal.any`                                                 | Node.js 24 — AbortSignal.any                                             |
| LC3 | Retries only on idempotent calls, with exponential backoff, jitter, an attempt cap, and the same signal                   | read the retry helper                                                  | RFC 9110 §9.2.2                                                          |
| LC4 | `requestTimeout` and `headersTimeout` are set explicitly, and `keepAliveTimeout` exceeds the load balancer's idle timeout | read the server construction                                           | Node.js 24 — http.Server                                                 |
| LC5 | SIGTERM makes readiness fail, calls `server.close()`, drains in-flight requests to a deadline, ends the pool, and exits 0 | send SIGTERM during a slow request; it completes and the process exits | Node.js 24 — http.Server.close; The Twelve-Factor App — IX Disposability |
| LC6 | Shutdown has a hard deadline after which it exits non-zero                                                                | hold a request open past the deadline; the process still exits         | The Twelve-Factor App — IX Disposability                                 |
| LC7 | `/health/live` checks only the process; `/health/ready` checks the pool                                                   | stop the database; live stays 200, ready turns 503                     | Kubernetes 1.37 — container probes                                       |
| LC8 | The process runs as `node dist/main.js`, not through `npm start`, so the signal reaches Node                              | read the Dockerfile `CMD`                                              | Node.js Docker best practices — CMD                                      |
| LC9 | Type-aware lint runs against a TypeScript inside typescript-eslint's peer range                                           | `pnpm ls typescript`; 8.70 accepts `<6.1.0`                            | typescript-eslint 8.70.1 — peerDependencies                              |

## Why each one

**LC1** is the default that surprises people. Node's global `fetch` is undici,
which waits up to 300 seconds for headers and 300 seconds between body chunks.
Your caller gave up long before; your handler, its pool client and its memory
are still waiting.

**LC5** is only true when tested. Most services have a SIGTERM handler; few
have ever received the signal while serving a request. The test is one line in
a script and it is the only evidence that a deploy does not drop requests.

**LC8** is the quiet cause of LC5 failing. A package manager in front of Node
may not forward the signal, and the orchestrator kills the container after its
grace period with requests still in flight.
