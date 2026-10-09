# Isolation ownership

Since Swift 6.2 a module can declare its default actor isolation. That makes
isolation an architectural decision with a file to change, rather than a habit
spread over annotations.

| #   | Check                                                                                                                         | How                                                                                            | Source   |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| IO1 | Every target states its default isolation rather than inheriting `nonisolated` by omission                                    | read `SWIFT_DEFAULT_ACTOR_ISOLATION` per target, or `.defaultIsolation(_:)` in `swiftSettings` | SE-0466  |
| IO2 | The default matches what the target is: `MainActor` for UI, `nonisolated` for domain, parsing, networking and storage         | compare each target's setting with its purpose                                                 | SE-0466  |
| IO3 | The decision is in an ADR, not only in a build setting                                                                        | find the ADR; it names which targets are `MainActor` and why                                   | SE-0466  |
| IO4 | Each actor in the design has a stated owner and a reason to be an actor rather than a `nonisolated` type with no shared state | read the actor declarations                                                                    | SE-0466  |
| IO5 | Crossing an isolation boundary is a design decision, not an `await` added to make an error go away                            | read each `await` across a module boundary                                                     | SE-0466  |
| IO6 | No per-file default isolation in production code                                                                              | `grep -rn "DefaultIsolationPerFile\|^default @MainActor\|^default nonisolated" .`              | SE-0478  |
| IO7 | Language mode 6 for every target, and a target still on 5 has a dated note saying what it is waiting for                      | read `swiftLanguageMode` / `SWIFT_VERSION` per target                                          | Xcode 27 |

## Why each one

**IO2 is the architectural half of a setting people treat as a formality.**
A default of `MainActor` on a parsing or networking target forces `@concurrent`
or `nonisolated` onto nearly every declaration in it, which is the same
annotation burden the setting exists to remove. The direction is a decision
about what the module is for.

**IO6 is a "not yet", with a reason.** File-level defaults are accepted but
not shipped: they sit behind an experimental flag, the accepted syntax is
`default @MainActor` rather than the typealias the proposal's title still
names, and file defaults supersede module defaults without inheriting
SE-0466's inference carve-outs — so the same code can error under a file
default where the module default suppressed it. Worth following; not worth
building a boundary on this quarter.

**IO3 is the row that makes the rest reviewable.** A build setting answers
"what"; the ADR answers "why", which is the question the next person has when a
target's default no longer fits.
