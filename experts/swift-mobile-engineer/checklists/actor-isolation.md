# Actor isolation

A SwiftUI app and the code under it want opposite defaults. Since Swift 6.2 a
module can say which it wants ([SE-0466](../references.md)), and a project that
never says ends up with `nonisolated` everywhere and `@MainActor` sprinkled by
hand until the compiler stops complaining.

| #   | Check                                                                                               | How                                                                                                                                   | Source   |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AI1 | Every target states its default isolation rather than inheriting one                                | read `SWIFT_DEFAULT_ACTOR_ISOLATION` per target in the project, or `.defaultIsolation(_:)` in `swiftSettings` for each package target | SE-0466  |
| AI2 | UI targets default to `MainActor`; networking, parsing and storage targets default to `nonisolated` | compare the setting of each target with what the target does                                                                          | SE-0466  |
| AI3 | No file-wide `@MainActor` added to silence a diagnostic in a `nonisolated` target                   | `grep -rn "^@MainActor" Sources` and read why each one is there                                                                       | SE-0466  |
| AI4 | `async` functions that do not touch the UI are `nonisolated`                                        | read each `async` declaration in a `MainActor` target                                                                                 | SE-0461  |
| AI5 | Work that must leave the caller's actor says so with `@concurrent`, and the reason is in the diff   | `grep -rn "@concurrent" Sources`                                                                                                      | SE-0461  |
| AI6 | The target builds in Swift 6 language mode                                                          | `grep -rn "swiftLanguageMode\|SWIFT_VERSION" .` — 6, not 5 with warnings                                                              | Xcode 27 |
| AI7 | No `@preconcurrency import` added without a dated note saying which dependency it is waiting for    | `grep -rn "@preconcurrency" Sources`                                                                                                  | SE-0466  |
| AI8 | No `nonisolated(unsafe)` without a comment naming what guarantees the safety                        | `grep -rn "nonisolated(unsafe)" Sources`                                                                                              | SE-0466  |

## Why each one

**AI2 is the row that changes code.** A default of `MainActor` on a parser or a
networking layer forces `@concurrent` or `nonisolated` on nearly everything in
it, which is the same annotation burden the setting exists to remove — in the
other direction. Choosing per target is the point of SE-0466; choosing once for
the whole project is how a team gets the burden back.

**AI7 and AI8 are the two escapes.** Both are legitimate and both are
load-bearing: `@preconcurrency` says a dependency has not caught up, and
`nonisolated(unsafe)` says a human has taken responsibility for a guarantee the
compiler cannot see. Neither is a finding. An undated `@preconcurrency` or an
unexplained `nonisolated(unsafe)` is, because the next reader cannot tell
whether the reason still holds.

**AI6 without AI1–AI5 is a migration that stalls.** Language mode 6 turns data
races into errors; the isolation defaults are what make the errors few enough
to fix. A project that turns on the mode and leaves the defaults unset spends
its budget on annotations.
