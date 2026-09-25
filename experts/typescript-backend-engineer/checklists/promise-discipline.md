# Promise discipline

Node has one event loop and one rule about rejections: since v15 an unhandled
rejection is raised as an uncaught exception, and the process exits. Every row
below either keeps that rule intact or keeps the loop free.

| #   | Check                                                                                         | How                                                                           | Source                                                      |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| PD1 | `@typescript-eslint/no-floating-promises` is an error, with type information enabled          | read `eslint.config.*`; run `pnpm exec eslint .`                              | typescript-eslint 8.70 — no-floating-promises               |
| PD2 | `@typescript-eslint/no-misused-promises` is an error                                          | read the config; grep `forEach(async` and `.on('…', async`                    | typescript-eslint 8.70 — no-misused-promises                |
| PD3 | Every `void promise` carries a comment naming who handles its failure                         | grep `void ` before a call                                                    | typescript-eslint 8.70 — no-floating-promises, ignoreVoid   |
| PD4 | No `unhandledRejection` or `uncaughtException` listener that logs and continues               | grep `process.on('unhandledRejection'`; the listener must exit non-zero       | Node.js 24 CLI — `--unhandled-rejections` (default `throw`) |
| PD5 | `--unhandled-rejections` is not set to `warn` or `none` in any start script or `NODE_OPTIONS` | grep `package.json`, the Dockerfile and deployment manifests                  | Node.js 24 CLI — `--unhandled-rejections`                   |
| PD6 | Express is major 5, or every async handler forwards its rejection to `next`                   | read `package.json`; on Express 4, grep async handlers without `.catch(next)` | Express 5 migration guide — rejected promises               |
| PD7 | No synchronous file, crypto or zlib call on a request path                                    | grep `Sync(` under the route and service directories                          | Node.js — Don't block the event loop                        |
| PD8 | No regex with nested quantifiers runs on unbounded input                                      | grep the regexes applied to request data; input length is bounded first (BV5) | Node.js — Don't block the event loop (ReDoS)                |
| PD9 | `return await` inside `try` blocks, so the rejection is caught where the code says it is      | `@typescript-eslint/return-await` set to `in-try-catch`                       | typescript-eslint 8.70 — return-await                       |

## Why each one

**PD1** is the rule this expert would keep if it could keep only one. A floating
promise is a write nobody waited for: the response says 201, the insert fails
afterwards, and the rejection either takes the process down mid-request for
some other caller or — with a lenient listener — vanishes.

**PD4** looks like defensive programming and is the opposite. Node's default
exits because the process is now in a state nobody reasoned about. A listener
that logs and continues keeps serving from that state.

**PD6** is a version pin that is also a correctness fix. On Express 4, a
rejected async handler never reaches the error middleware; the client waits
until its own timeout and the log shows nothing.
