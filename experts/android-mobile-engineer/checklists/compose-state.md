# Compose state

Compose redraws what reads state that changed. Every row here is about state
being observable, owned in one place, and compared the way the compiler will
compare it.

| #   | Check                                                                                                | How                                                                                         | Source                              |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| CS1 | Screen composables take a UI state and event lambdas; the ViewModel is resolved at the route only    | `grep -rn "hiltViewModel()\|viewModel()" src/main`; each hit is in a route-level composable | Compose — state and Jetpack Compose |
| CS2 | State is hoisted to the lowest common reader and the highest writer                                  | read composables that pass the same value to siblings                                       | Compose — state and Jetpack Compose |
| CS3 | No `mutableListOf()`, `ArrayList` or `HashMap` held in `remember`                                    | `grep -rnE "remember\s*\{\s*(mutableListOf\|ArrayList\|mutableMapOf\|HashMap)" src/main`    | Compose — state and Jetpack Compose |
| CS4 | State that must survive rotation and process death uses `rememberSaveable` or `SavedStateHandle`     | read form fields and scroll-sensitive state held in plain `remember`                        | Compose — state and Jetpack Compose |
| CS5 | Composables do not allocate a new collection or object from unchanged input on every recomposition   | read parameters built inline with `listOf(`, `.map {`, `.filter {` at the call site         | Compose — strong skipping mode      |
| CS6 | `@Stable` / `@Immutable` are used only where structural equality is intended, not to silence reports | `grep -rnE "@(Stable\|Immutable)" src/main`; each has a reason                              | Compose — strong skipping mode      |
| CS7 | No side effects in composition: I/O, logging and navigation go through `LaunchedEffect` or callbacks | read composable bodies for calls outside effects                                            | Compose — state and Jetpack Compose |
| CS8 | Lazy lists pass a stable `key` and, for mixed rows, a `contentType`                                  | `grep -rn -A3 "items(" src/main \| grep -c "key ="`                                         | Compose BOM 2026.09.00 — Lazy lists |

## Why each one

**CS3** is the defect that makes users see stale data. Adding to an `ArrayList`
inside `remember` changes nothing Compose observes, so the screen does not
update until something else causes a recomposition.

**CS1** keeps composables previewable and testable. A leaf that calls
`hiltViewModel()` cannot be rendered without the dependency graph, so it stops
being tested.

**CS5** is the strong-skipping consequence. Since Kotlin 2.0.20 unstable
parameters are compared by instance; a list rebuilt at the call site is a new
instance every time, and the child recomposes on every frame its parent does.
