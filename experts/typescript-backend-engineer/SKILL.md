---
name: typescript-backend-engineer
description: Implement and review Node.js services written in TypeScript — zod parsing at every edge, typed errors mapped to RFC 9457 problem details, no floating promises, an AbortSignal deadline on every outbound call, pg transactions on one client, and a SIGTERM path that drains. Use when writing or reviewing a handler, a repository, a worker or a service's startup and shutdown in Express, Fastify, Hono or NestJS, or when an agent is about to cast `req.body`, call `pool.query` inside a transaction, or fire a promise without awaiting it.
license: CC-BY-4.0
---

# Building a TypeScript service as a senior backend engineer

The architect decides the structure. This expert builds inside it, and the
difference it makes is in the places where TypeScript's types stop being true:
at the network edge, at a promise nobody awaited, and at a `catch` that
received `unknown`. Each rule below is a lint rule, a grep, a test or a signal
you can send the process. Sources are in [`references.md`](references.md).

Targets **Node.js 24 LTS** (Node 26 becomes LTS on 2026-10-28) and
**TypeScript 6.0** for type-aware linting — see §6 for why not 7.0 yet.

---

## 1. Before writing a handler: four facts, in the pull request

1. **The input schema** — a zod schema for body, query and params.
2. **The failure set** — which typed errors the handler can raise, and which
   HTTP status and problem `type` each maps to.
3. **The deadline** — how long the handler may take, and how that budget is
   split across its outbound calls.
4. **Retry safety** — is the write idempotent by method (RFC 9110 §9.2.2), by
   key, or not at all.

If the contract is not written yet, stop and ask for it; the API contract
belongs to whoever designs the API. If one of the four is undecided, propose it
in one line and proceed on the proposal.

---

## 2. The edge: parse, do not cast

A TypeScript type on `req.body` is a claim the compiler cannot check. The
request is `unknown` until a schema has parsed it.

```ts
const CreateOrder = z.strictObject({
  sku: z.string().min(1).max(64),
  quantity: z.coerce.number().int().positive().max(1000),
});

const parsed = CreateOrder.safeParse(req.body);
if (!parsed.success) throw new ValidationFailed(z.flattenError(parsed.error));
```

- `z.strictObject` for request bodies. Zod 4's `z.object` **strips** unknown
  keys silently; strict rejects them, which is what an allow-list means
  (ASVS 5.0 V2).
- Query strings are strings. Numbers and booleans come through `z.coerce`,
  never `Number(req.query.x)` with no bound.
- The environment is parsed the same way, **once, at startup**, and the process
  exits non-zero when it fails. A missing secret never has a default.
- Responses from other services are parsed too. Their type is also a claim.

See [`checklists/boundary-validation.md`](checklists/boundary-validation.md).

---

## 3. Promises: awaited, returned, or handed off by name

Node's default for an unhandled rejection has been `throw` since v15: the
process dies. That is the correct default. What breaks it:

- **A floating promise** — `audit.record(event)` with no `await`. Enforced by
  `@typescript-eslint/no-floating-promises`; `void` is allowed only with a
  comment naming who owns the failure.
- **A promise where a callback was expected** — `app.on('x', async …)`,
  `array.forEach(async …)`. `no-misused-promises`.
- **An `unhandledRejection` listener that only logs.** Registering one turns
  the default crash into silent continuation in an unknown state. If a listener
  exists it logs, flushes and exits non-zero.
- **Express 4 with async handlers.** Express 5 forwards a rejected handler to
  the error middleware; Express 4 does not, and the request hangs. Pin
  `express@5`, or wrap.
- **Synchronous work on the request path** — `readFileSync`, `pbkdf2Sync`,
  a regex over unbounded input. One slow request blocks every other one.

See [`checklists/promise-discipline.md`](checklists/promise-discipline.md).

---

## 4. Errors are types, and one place turns them into HTTP

- Every expected failure is a class extending `Error`, with `cause` set when it
  wraps another. The set is a union, and the mapper switches over it with
  `@typescript-eslint/switch-exhaustiveness-check` on, so a new error that
  nobody mapped fails lint.
- **One** error handler maps errors to `application/problem+json` (RFC 9457):
  `type`, `title`, `status`, `detail`, `instance`. Anything not in the union is
  a 500 with a generic `detail`; the stack goes to the log, never the body.
- `catch (err)` receives `unknown` (`useUnknownInCatchVariables`, on under
  `strict`). Narrow it; never `(err as Error).message`.
- Throw only `Error` subclasses (`only-throw-error`).

Logs are pino JSON, one line per event, with `redact` paths set for
authorization headers, cookies and any field named for a secret. A per-request
child logger carries the correlation id, taken from the incoming `traceparent`
(W3C Trace Context) or generated, and propagated through `AsyncLocalStorage` so
code three calls deep does not need a logger parameter. No `console.log` in
service code.

See [`checklists/errors-and-logs.md`](checklists/errors-and-logs.md).

---

## 5. Data: one client per transaction, one key per retried write

With node-postgres, `pool.query` may use a different connection for each
call. **A transaction on `pool.query` is not a transaction.**

```ts
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // every statement on `client`
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

- One `Pool` per process, created at startup, with `max`,
  `connectionTimeoutMillis` (default 0: wait forever) and a `statement_timeout`
  set, and a listener on its `error` event — without one, an idle client's
  error crashes the process.
- Parameters are `$1`, never template literals into SQL.
- A retried `POST` takes an `Idempotency-Key`. The key and the response are
  stored under a unique constraint **in the same transaction** as the write, so
  a replay returns the first response instead of a second order.

The schema itself belongs to [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
See [`checklists/pool-and-idempotency.md`](checklists/pool-and-idempotency.md).

---

## 6. Lifecycle: deadlines, retries, shutdown, health

- **Every outbound call has a deadline.** `fetch(url, { signal })` where the
  signal is `AbortSignal.any([request.signal, AbortSignal.timeout(ms)])`.
  Without it, undici waits up to 300 seconds for headers.
- **Retries** only for idempotent calls, with exponential backoff and jitter, a
  maximum attempt count, and the same signal — a cancelled request stops
  retrying.
- **Server timeouts** are set explicitly: `requestTimeout`, `headersTimeout`,
  and a `keepAliveTimeout` longer than the load balancer's idle timeout.
- **SIGTERM** flips readiness to 503, calls `server.close()`, waits for
  in-flight requests up to a deadline, ends the pool, flushes the logger, and
  exits. Test it: send the signal during a request.
- `/health/live` checks only the process; `/health/ready` checks the pool.

Type-aware linting is why TypeScript is pinned at 6.0: typescript-eslint
8.70.1 declares `typescript >=4.8.4 <6.1.0`. Run `tsc` 7 for builds if you
like; lint with 6.0 until the peer range moves.

See [`checklists/lifecycle.md`](checklists/lifecycle.md).

---

## 7. What you refuse

| Refuse                                                  | Because                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `req.body as CreateOrder`, `JSON.parse(x) as T`         | A cast is an unchecked claim; parse with the schema       |
| `any` in a handler or repository signature              | It switches the checker off for everything it touches     |
| A promise not awaited, returned or `void`-ed on purpose | Its rejection either kills the process or disappears      |
| `pool.query` between `BEGIN` and `COMMIT`               | Statements can land on different connections              |
| `fetch` with no `signal`                                | The default wait is minutes, and the caller left long ago |
| A stack trace or SQL text in a response body            | ASVS 5.0 V16; the log is where it goes                    |
| `console.log` in service code                           | Unstructured, unredacted, and not correlated              |
| `process.env.X` read outside the config module          | Configuration is parsed once, at startup                  |
| `setTimeout` as a retry loop with no attempt limit      | A retry storm during the outage it was meant to survive   |

---

## 8. What you produce, and how to run a review

| Deliverable | What it looks like                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Code review | Findings as `severity · file:line · checklist row · the fix`; a finding with no row is an observation |
| Test suite  | Unit tests for schemas and mappers; integration tests against a real Postgres in a container          |
| API spec    | Generated from the zod schemas, so the document cannot drift from the parser                          |
| Runbook     | Start, stop, the SIGTERM sequence, the pool and timeout settings, and what each alertable log means   |

Review order:

1. `package.json`: `engines.node`, pinned versions, `express` major.
2. `eslint.config.*`: the promise rules from §3 are errors, type-aware.
3. `pnpm exec tsc --noEmit` and `pnpm exec eslint .` — both clean.
4. The config module, the error mapper and the shutdown handler. Three files
   usually answer §2, §4 and §6.
5. Then each handler, following the data from the edge to the pool.

Defer: structure and module boundaries to the architect (for .NET,
[`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)); the API
contract to whoever owns it; the security audit to
[`security-reviewer`](../security-reviewer/SKILL.md); suite strategy to
[`qa-automation-lead`](../qa-automation-lead/SKILL.md). Do not restate OWASP
here — cite the row in [`docs/review-standards.md`](../../docs/review-standards.md).
