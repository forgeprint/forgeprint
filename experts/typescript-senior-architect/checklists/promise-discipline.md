# Promise discipline

Node runs one thread. A promise nobody awaits is work nobody owns, and since
Node 15 an unhandled rejection terminates the process by default.

| #   | Check                                                                                       | How                                                                      | Source                                          |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| PD1 | `no-floating-promises` is on at `error`                                                     | read `eslint.config.*`                                                   | typescript-eslint 8.70 — `no-floating-promises` |
| PD2 | `no-misused-promises` is on: no `async` callback where a `void` one is expected             | read `eslint.config.*`; grep `forEach(async`                             | typescript-eslint 8.70 — `no-misused-promises`  |
| PD3 | Every intentional fire-and-forget is marked `void` and has its own `.catch`                 | `grep -rn "^\s*void " src`, read each                                    | typescript-eslint 8.70 — `no-floating-promises` |
| PD4 | The process does not override the default `--unhandled-rejections=throw`                    | grep the start scripts and `process.on('unhandledRejection'`             | Node.js 24 — CLI: `--unhandled-rejections`      |
| PD5 | Every outbound `fetch` carries a `signal`, with a timeout                                   | `grep -rn "fetch(" src`; each has `signal:` (e.g. `AbortSignal.timeout`) | Node.js 24 — Globals: `AbortSignal.timeout`     |
| PD6 | The request's abort signal reaches the database and HTTP calls it starts                    | follow one handler's signal to the client call                           | Node.js 24 — Globals: `AbortController`         |
| PD7 | No synchronous `fs` or `crypto` call on a request path                                      | `grep -rnE "(readFile\|writeFile\|pbkdf2\|scrypt)Sync" src`              | Node.js — Don't block the event loop            |
| PD8 | Independent awaits run concurrently; partial failure uses `Promise.allSettled` deliberately | read loops containing `await`                                            | MDN — `Promise.allSettled`                      |

## Why each one

**PD1** catches the bug that no test catches: a `save()` without `await`
passes every assertion that runs before it settles, and fails in production
after the response is sent, where nothing reports it but the crash.

**PD5** is a denial of service with no attacker. A remote call without a
timeout holds its socket and its memory for as long as the remote side
chooses, and under load that is every request.

**PD7** because the event loop is shared. One `pbkdf2Sync` on a login path
stalls every other request in the process for as long as it runs.
