# Transaction boundary

One unit of work per request, owned by one thing, named. The failure this
prevents is not a crash — it is nobody being able to say what is atomic.

| #   | Check                                                                       | How                                                                     | Source                                           |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| T1  | `SaveChangesAsync` is called from one place per request                     | grep it and count the call sites on each path                           | —                                                |
| T2  | No repository calls `SaveChangesAsync`                                      | grep the repository implementations                                     | A repository stages; the caller commits          |
| T3  | Read-only queries use `AsNoTracking()`                                      | find the queries not followed by a write                                | EF Core no-tracking queries                      |
| T4  | Anything spanning two aggregates is an explicit, named transaction          | `BeginTransactionAsync` with a comment naming the invariant it protects | —                                                |
| T5  | No transaction is held open across an HTTP or broker call                   | read every transaction scope                                            | —                                                |
| T6  | `DbContext` is scoped, never singleton, never captured in a background task | read the registration; grep background work                             | ASP.NET Core best practices — background threads |
| T7  | Queries filter and aggregate in the database, not in memory                 | look for materialisation before filtering                               | ASP.NET Core best practices — data access        |

## Why each one

**T5** is the one that survives review and then takes production down. A
transaction open across a network call holds its locks for the remote system's
timeout rather than yours, and the failure only appears under the load that
makes the remote system slow — which is the load you cared about.

**T6** produces a disposed-context exception in a background task: reliably,
but only after the response has been sent, which is where nobody is looking.
