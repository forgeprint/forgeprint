# Errors and logs

Expected failures are types. One function turns them into HTTP. Everything
else is a 500 whose details go to a structured log line that can be found by
its correlation id.

| #    | Check                                                                                               | How                                                                                         | Source                                               |
| ---- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| EL1  | Each expected failure is an `Error` subclass, and wrapping sets `cause`                             | read the errors module; grep `new Error(` in services                                       | ECMAScript 2022 — Error cause; TypeScript 6.0        |
| EL2  | One error mapper produces `application/problem+json` with `type`, `title`, `status`, `detail`       | find the Express error middleware, Fastify `setErrorHandler`, Hono `onError` or Nest filter | RFC 9457 §3                                          |
| EL3  | The mapper's `switch` over the error union is exhaustive, enforced by lint                          | `@typescript-eslint/switch-exhaustiveness-check` is an error                                | typescript-eslint 8.70 — switch-exhaustiveness-check |
| EL4  | An unmapped error becomes 500 with a generic `detail`; no stack, SQL or host in the body            | throw a raw `Error` in a test; assert on the body                                           | OWASP ASVS 5.0.0 V16; RFC 9457 §5                    |
| EL5  | Only `Error` subclasses are thrown or rejected                                                      | `only-throw-error` and `prefer-promise-reject-errors` are errors                            | typescript-eslint 8.70                               |
| EL6  | `catch` variables are `unknown` and narrowed before use                                             | `strict` is on in `tsconfig.json`; grep `(err as Error)`                                    | TypeScript 6.0 — useUnknownInCatchVariables          |
| EL7  | Logs are pino JSON with `redact` covering authorization, cookie and secret-named paths              | read the logger construction                                                                | pino 10.3 — redaction; OWASP ASVS 5.0.0 V16          |
| EL8  | A per-request child logger carries a correlation id from `traceparent`, or a generated one          | read the request hook; send a request with `traceparent` and find the id in the log         | W3C Trace Context Level 1                            |
| EL9  | The request context is reached through `AsyncLocalStorage`, not a logger parameter threaded by hand | grep `AsyncLocalStorage` and its `run()` in the request hook                                | Node.js 24 — async_context                           |
| EL10 | No `console.log`, `console.error` in `src/`                                                         | `no-console` is an error                                                                    | ESLint 10 — no-console                               |

## Why each one

**EL3** is where the type system earns its keep in error handling. Add
`QuotaExceeded` to the union, forget the mapper, and lint fails — instead of the
new error falling through to a 500 in production.

**EL4** is the other half of the same function. The mapper decides what the
caller learns; an error it does not know must teach the caller nothing, and
the log must teach the on-call engineer everything.

**EL8** is what makes the rest findable. A problem response with an `instance`
that matches the log line's correlation id turns a support ticket into one
query.
