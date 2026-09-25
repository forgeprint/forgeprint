# Test layers

Two layers, each with a job. Unit tests pin the schemas and the error mapper,
which are pure. Integration tests run the real HTTP stack against a real
database, because the bugs in §5 of the skill do not exist against a mock.

| #   | Check                                                                                                         | How                                                                              | Source                                           |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| TL1 | Tests run on `node:test` or Vitest, pinned, with one command                                                  | read `package.json` scripts; `pnpm test` runs both layers                        | Node.js 24 — test runner; Vitest 5.0             |
| TL2 | Every request schema has a test that sends an unknown key and one that exceeds each bound                     | find the schema tests                                                            | OWASP ASVS 5.0.0 V2; Zod 4.6                     |
| TL3 | Every member of the error union has a test asserting status, `type` and content type from the mapper          | find the mapper tests; count against the union                                   | RFC 9457 §3                                      |
| TL4 | Handlers are exercised in-process: Fastify `inject`, Hono `app.request`, or an HTTP call to an ephemeral port | read the integration tests                                                       | Fastify 5 — testing; Hono 4 — testing            |
| TL5 | Integration tests use PostgreSQL in a container, not an in-memory substitute                                  | grep `@testcontainers/postgresql`                                                | Testcontainers for Node.js 12.1                  |
| TL6 | A test proves a failed transaction leaves no rows                                                             | force the second statement to fail; count rows                                   | node-postgres 8.23 — transactions                |
| TL7 | A test replays the same idempotency key and gets the first response and one row                               | find the replay test                                                             | IETF draft idempotency-key-header-07             |
| TL8 | Backoff and timeouts are tested with fake timers, not sleeps                                                  | grep `setTimeout` and `sleep(` in tests; use `mock.timers` or `vi.useFakeTimers` | Node.js 24 — test runner mock timers; Vitest 5.0 |
| TL9 | A test sends SIGTERM during a request and asserts the request completes and the process exits                 | find the shutdown test, or the script that does it in CI                         | The Twelve-Factor App — IX Disposability         |

## Why each one

**TL5** is the row that decides whether TL6 and TL7 mean anything. An in-memory
fake has no connections, so it cannot show the `pool.query`-in-a-transaction
bug; it has no unique constraints, so it cannot show a replayed write.

**TL3** keeps the error contract honest. Clients branch on `type`; a test per
union member is how a renamed error stays a deliberate, visible change.

**TL8** keeps the suite fast and deterministic. A retry test that sleeps is a
slow test that sometimes fails, and it is the first test somebody disables.
