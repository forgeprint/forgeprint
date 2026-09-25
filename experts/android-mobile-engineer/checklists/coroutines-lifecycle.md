# Coroutines and lifecycle

Kotlin coroutines are structured: a coroutine belongs to a scope and ends when
the scope does. On Android the scopes that matter are the ViewModel's and the
UI lifecycle's, and most leaks are a coroutine launched somewhere else.

| #   | Check                                                                                          | How                                                                                       | Source                                                       |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| CL1 | Flows from a ViewModel are collected with `collectAsStateWithLifecycle()`                      | `grep -rn "collectAsState()" src/main` returns nothing                                    | Compose — state; lifecycle-runtime-compose 2.11.0            |
| CL2 | No `GlobalScope`                                                                               | `grep -rn "GlobalScope" src/main` returns nothing                                         | Android — coroutines best practices                          |
| CL3 | ViewModels launch in `viewModelScope` and expose `StateFlow` / `Flow`, never a `Mutable*` type | `grep -rnE "val \w+\s*=\s*MutableStateFlow" src/main`; each is `private`                  | Android — coroutines best practices                          |
| CL4 | Dispatchers are injected, not hard-coded in repositories                                       | `grep -rn "Dispatchers\.\(IO\|Default\)" src/main`; hits only in the DI module            | Android — coroutines best practices                          |
| CL5 | Repository and data-source functions are `suspend` or return `Flow`, and main-safe             | read the data layer for blocking calls outside `withContext`                              | Android — coroutines best practices                          |
| CL6 | No broad `catch` that swallows `CancellationException`                                         | `grep -rn -A2 "catch (e: \(Exception\|Throwable\))" src/main`; each rethrows cancellation | Android — coroutines best practices; kotlinx.coroutines 1.11 |
| CL7 | Long loops or blocking work check for cancellation (`ensureActive()`, `yield()`)               | read `while` loops inside coroutines                                                      | Android — coroutines best practices                          |
| CL8 | Work that must survive the process uses WorkManager, not a coroutine in an application scope   | read uploads, syncs and anything started "in the background"                              | Android — coroutines best practices                          |
| CL9 | `stateIn` uses `SharingStarted.WhileSubscribed(…)` with a timeout, not `Eagerly`, for UI state | `grep -rn "SharingStarted\." src/main`                                                    | kotlinx.coroutines 1.11 — `SharingStarted`                   |

## Why each one

**CL1** because `collectAsState()` is the platform-agnostic API and keeps
collecting when the app is in the background: a location or database flow keeps
running, and so does the battery drain. The lifecycle-aware variant stops
below `STARTED`.

**CL2** because a `GlobalScope` coroutine holds whatever it captured — often a
screen — until it finishes, and a test cannot wait for it or cancel it.

**CL6** is the subtle one. `catch (e: Exception)` around a suspending call
also catches the `CancellationException` that cancellation uses, and the
coroutine carries on after its scope has ended.
