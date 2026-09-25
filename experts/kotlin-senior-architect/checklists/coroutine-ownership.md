# Coroutine ownership

Structured concurrency is an architectural property: every coroutine has a
parent, every scope has an owner, and cancelling the owner cancels the work.
The rows below find the places a codebase has stepped outside that structure.

| #   | Check                                                                                                           | How                                                                                                  | Source                                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| CO1 | No `GlobalScope`, and no `@OptIn(DelicateCoroutinesApi::class)` without a written reason                        | `grep -rn "GlobalScope\|DelicateCoroutinesApi" src/main/kotlin`                                      | kotlinx.coroutines 1.11 — `GlobalScope`                     |
| CO2 | Every `CoroutineScope(...)` constructed in production code belongs to an object that cancels it                 | `grep -rn "CoroutineScope(" src/main/kotlin`; each has a matching `cancel()` in a close or stop path | kotlinx.coroutines 1.11 — coroutine scope                   |
| CO3 | `runBlocking` appears only in `main`, tests and framework bridges named in the ADR                              | `grep -rn "runBlocking" src/main/kotlin`                                                             | kotlinx.coroutines 1.11 — `runBlocking`                     |
| CO4 | Concurrent fan-out uses `coroutineScope {}`; `supervisorScope {}` only where children are independent by design | `grep -rn "supervisorScope\|SupervisorJob" src/main/kotlin`; each has a reason                       | kotlinx.coroutines 1.11 — coroutine scope                   |
| CO5 | Dispatchers are injected; the domain module names no `Dispatchers.*`                                            | `grep -rn "Dispatchers\." <domain module>/src/main` returns nothing                                  | kotlinx.coroutines 1.11 — coroutine context and dispatchers |
| CO6 | A broad `catch` inside a coroutine rethrows `CancellationException`                                             | `grep -rn -A3 "catch (e: \(Exception\|Throwable\))" src/main/kotlin`                                 | kotlinx.coroutines 1.11 — cancellation and timeouts         |
| CO7 | Ktor background work is launched in the `Application` scope, not an ad-hoc one                                  | read `Application.module` functions for `launch` and `CoroutineScope(`                               | Ktor 3.6 — modules                                          |
| CO8 | Spring handlers that suspend are `suspend fun`, not `runBlocking` wrappers around suspending code               | `grep -rn "runBlocking" src/main/kotlin` in Spring modules                                           | Spring Boot 4.1 — Kotlin support                            |
| CO9 | Blocking I/O inside a coroutine runs under an injected I/O dispatcher, with a timeout                           | read repository and client calls for `withContext` and `withTimeout`                                 | kotlinx.coroutines 1.11 — cancellation and timeouts         |

## Why each one

**CO2** is the one agents write most. `CoroutineScope(Dispatchers.IO).launch
{ … }` in a service method compiles, runs, and creates a scope nobody holds a
reference to: the work cannot be cancelled on shutdown and its exceptions go
to the default handler.

**CO6** because `CancellationException` is how cancellation travels. A
`catch (e: Exception)` that logs and continues keeps a cancelled coroutine
running after its owner has gone.

**CO4** because the choice between `coroutineScope` and `supervisorScope` is
the choice between "one failure fails the batch" and "each item stands alone".
Both are right somewhere; neither is right by default.
