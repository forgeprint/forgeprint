# Module boundaries

In Swift the boundary is the module, and the wall is `internal` — which is the
default, so the wall exists until somebody types `public`. The question an
architect answers is which modules exist and what each one is allowed to see.

| #   | Check                                                                                                              | How                                                                                              | Source  |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------- |
| MB1 | The module graph is in the repository, not in somebody's head: a file lists the targets and which depends on which | read `Package.swift` dependencies, or the project's target dependencies                          | SE-0386 |
| MB2 | No dependency cycle, and no target that depends on everything                                                      | read the dependency lists; a target imported by all of them is a sign the boundary is wrong      | SE-0386 |
| MB3 | A symbol used by a sibling module in the same package is `package`, not `public`                                   | `grep -rn "^public\|    public" Sources` and ask which module outside the package needs each one | SE-0386 |
| MB4 | A target that must not reach package symbols sets `packageAccess: false`                                           | read the manifest for test and sample targets                                                    | SE-0386 |
| MB5 | A package built outside SwiftPM passes `-package-name`, or `package` is silently unavailable                       | read the build settings; without the flag the modifier is an error                               | SE-0386 |
| MB6 | `@testable import` appears in tests only, and no production target depends on a test target                        | `grep -rn "@testable" Sources Tests`                                                             | SE-0386 |
| MB7 | A name that exists in two modules is disambiguated with a module selector rather than renamed around               | `grep -rn "::" Sources` where the ambiguity is real                                              | SE-0491 |

## Why each one

**MB3 is the row that pays for this checklist.** `public` is what people type
when `internal` stops working, and it is the one access level that cannot be
taken back without breaking somebody. `package` exists precisely for "another
module of mine needs this", and it has existed since Swift 5.9 — so a codebase
full of `public` symbols that no client imports is a boundary nobody drew.

**MB5 is the trap in MB3.** Outside SwiftPM — a plain Xcode target, a custom
build — `package` is an error unless `-package-name` is passed. A team that
adopts MB3 and then adds an Xcode-built target gets a confusing failure in a
file nobody changed.

**MB2 is read, not computed.** There is no cheap command for "this target
depends on everything"; there is a dependency list a person can read in a
minute, and the answer is usually obvious once it is written down.
