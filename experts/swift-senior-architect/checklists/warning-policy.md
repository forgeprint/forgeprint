# Warning policy

A warning nobody has to act on is a warning that teaches people to scroll past
warnings. Swift 6.4 made the policy expressible in the source and the manifest,
which makes it an architectural decision rather than a per-developer habit.

| #   | Check                                                                                                                            | How                                                          | Source                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| WP1 | The project has a written warning policy: which warnings are errors, and where an exception lives                                | find the document or the ADR                                 | SE-0522                     |
| WP2 | Warnings are errors for the project's own targets                                                                                | read `SWIFT_TREAT_WARNINGS_AS_ERRORS` per target             | Xcode 27                    |
| WP3 | A suppressed warning is suppressed at the narrowest scope, with `@diagnose` at the declaration rather than a flag for the module | `grep -rn "@diagnose" Sources` against the module-wide flags | SE-0522                     |
| WP4 | Every suppression names what it is waiting for and when it should be looked at again                                             | read each `@diagnose` and its comment                        | SE-0522                     |
| WP5 | A package that sets `treatWarning` in the manifest does it per diagnostic group, not for everything                              | read `Package.swift`                                         | Embedded Swift restrictions |
| WP6 | No warning is suppressed in a dependency's name without an issue link                                                            | read the suppressions against the issue tracker              | SE-0522                     |
| WP7 | The CI log has zero warnings for the project's own targets, so a new one is visible                                              | read the log, not the local build                            | Xcode 27                    |

## Why each one

**WP3 is what SE-0522 made possible.** Before it, silencing one warning meant a
flag for a whole module, so the usual choice was between a module-wide blind
spot and living with the noise. `@diagnose` at the declaration makes the
suppression as narrow as the problem.

**WP4 is the row that keeps WP3 honest.** A narrow suppression with no note is
still permanent, because nobody knows what would let them remove it. A date and
a reason make it reviewable.

**WP7 is the only row here that is about CI rather than source.** A project that
tolerates warnings in the log cannot tell a new one from the forty that were
already there, which is the state WP2 exists to prevent and WP7 is the evidence
for.
