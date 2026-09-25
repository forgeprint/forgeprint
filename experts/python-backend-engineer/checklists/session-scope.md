# Session scope

A session is a unit of work: it opens, it commits or rolls back, it closes.
The bugs in this list are all a session that lives longer, or reaches wider,
than the work it belongs to.

| #    | Check                                                                                                                  | How                                                                                 | Source                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| SS1  | One Session per request, provided by a dependency that yields and closes it                                            | find the session dependency; grep for a module-level `Session(` or `SessionLocal()` | SQLAlchemy 2.0.54 — Session basics                            |
| SS2  | No `AsyncSession` is shared by concurrent tasks                                                                        | grep `asyncio.gather` and `TaskGroup` bodies for a shared `session`                 | SQLAlchemy 2.0.54 — asyncio, concurrent tasks                 |
| SS3  | `async_sessionmaker` sets `expire_on_commit=False`                                                                     | read the sessionmaker call                                                          | SQLAlchemy 2.0.54 — asyncio                                   |
| SS4  | Relationships are loaded eagerly (`selectinload`) or declared `lazy="raise"`; no implicit lazy load under asyncio      | grep `relationship(` for `lazy=`; run the tests with a lazy access                  | SQLAlchemy 2.0.54 — asyncio, preventing implicit IO           |
| SS5  | Writes run inside `session.begin()` or `transaction.atomic()`; commits are not scattered through services              | grep `commit()` call sites outside the unit-of-work boundary                        | SQLAlchemy 2.0.54 — Session basics; Django 6.1 — transactions |
| SS6  | Django: no database exception is caught inside an `atomic` block                                                       | read every `try` inside `atomic`                                                    | Django 6.1 — transactions                                     |
| SS7  | Django: background work is enqueued with `transaction.on_commit`                                                       | grep `.delay(` and `enqueue(` inside atomic paths                                   | Django 6.1 — transactions, on_commit                          |
| SS8  | Pool settings are explicit: `pool_size`, `max_overflow`, `pool_timeout`, `pool_pre_ping`                               | read `create_engine` / `create_async_engine`; defaults are 5, 10, 30 s and off      | SQLAlchemy 2.0.54 — Engine configuration                      |
| SS9  | Django under ASGI: `CONN_MAX_AGE` is 0 and the PostgreSQL `pool` option is used                                        | read `DATABASES`                                                                    | Django 6.1 — databases, connection pool                       |
| SS10 | SQL uses bound parameters; no f-string or `%` builds a statement                                                       | ruff S608; grep `text(f"`                                                           | ruff 0.16.8 — S608; OWASP ASVS 5.0.0 V1                       |
| SS11 | An idempotency key and its stored response are written in the same transaction as the write, under a unique constraint | read the create handlers; a replay test returns one row                             | RFC 9110 §9.2.2; IETF draft idempotency-key-header-07         |

## Why each one

**SS2** fails intermittently, which is the worst way to fail. Two tasks
awaiting on one `AsyncSession` interleave on one connection; most of the time
the queries happen not to overlap, and the test suite, which runs one request
at a time, never sees it.

**SS6** is Django-specific and counter-intuitive. Catching `IntegrityError`
inside `atomic` hides the failure from the block, which then tries to commit a
transaction the database has already marked as broken.

**SS7** is the difference between "the email was sent" and "the order exists".
Enqueued inside the transaction, the job can run before the commit, or after a
rollback, and find nothing.
