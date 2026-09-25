# Pool and idempotency

node-postgres hands out a connection per call unless you hold one. That single
fact decides whether a transaction exists, and it is the most common data bug
in a Node service.

| #    | Check                                                                                                | How                                                                      | Source                                                |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| PI1  | Transactions run on one client from `pool.connect()`; no `pool.query` between `BEGIN` and `COMMIT`   | grep `BEGIN`; every statement until `COMMIT` uses the same client        | node-postgres 8.23 — Pool, transactions               |
| PI2  | The client is released in `finally`, on every path                                                   | read each `pool.connect()` site                                          | node-postgres 8.23 — Pool, releasing clients          |
| PI3  | One `Pool` per process, built at startup from parsed config                                          | grep `new Pool(`                                                         | node-postgres 8.23 — Pool                             |
| PI4  | `max`, `connectionTimeoutMillis` and `idleTimeoutMillis` are set, not left at defaults               | read the pool options; `connectionTimeoutMillis` default 0 waits forever | node-postgres 8.23 — Pool constructor                 |
| PI5  | The pool has an `error` listener                                                                     | grep `pool.on('error'`                                                   | node-postgres 8.23 — Pool events                      |
| PI6  | A statement timeout is set for the service's role or connection                                      | read the pool config or the role's settings for `statement_timeout`      | PostgreSQL 18 — client connection defaults            |
| PI7  | Queries use `$n` parameters; no template literal builds SQL from input                               | grep `` query(` `` with `${`                                             | OWASP ASVS 5.0.0 V1; node-postgres 8.23 — queries     |
| PI8  | A non-idempotent write that clients may retry accepts an idempotency key                             | read the POST handlers that create things                                | RFC 9110 §9.2.2; IETF draft idempotency-key-header-07 |
| PI9  | The key and the stored response are written under a unique constraint in the write's own transaction | read the handler; a replay test returns the first response and one row   | IETF draft idempotency-key-header-07                  |
| PI10 | No transaction is held open across an outbound HTTP call                                             | read every `BEGIN` … `COMMIT` span for `fetch`                           | node-postgres 8.23 — Pool (clients are finite)        |

## Why each one

**PI1** fails silently. Each `pool.query` succeeds; `BEGIN` ran on one
connection, the inserts on two others, and `COMMIT` on a fourth. Nothing was
atomic, and a test with a pool of one will never show it.

**PI5** is a crash with no request attached. A database restart errors an idle
client; with no listener, Node raises it as an uncaught error and the process
exits between requests.

**PI9** is why the key is not a cache entry. Stored anywhere but inside the
same transaction, a crash between the write and the key leaves a write that a
retry will repeat.
