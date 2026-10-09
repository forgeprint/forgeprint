# Data migrations

A schema change ships once and runs on every install that has data. SwiftData
makes the versions explicit; it does not make them tested.

| #   | Check                                                                                                                   | How                                                                          | Source                              |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| DM1 | Each shipped schema is a `VersionedSchema`, and the plan lists them in order                                            | read the `SchemaMigrationPlan`                                               | SwiftData migrations                |
| DM2 | A change that needs code — uniqueness, a split field, a renamed relationship — is a custom stage, not a lightweight one | read each stage's type against what changed between its two schemas          | SwiftData migrations                |
| DM3 | Every custom stage has a test that runs it against a store built from the previous schema                               | `grep -rn "willMigrate\|didMigrate" Sources` against the test names          | SwiftData migrations                |
| DM4 | No new `VersionedSchema` for a change a default would have covered                                                      | compare consecutive schemas; an added optional with a default is lightweight | SwiftData migrations                |
| DM5 | The migration runs once in a test with a realistic row count, and the time is recorded                                  | the test output                                                              | SwiftData migrations                |
| DM6 | A schema that only exists on newer systems is appended behind an availability check                                     | read the plan for `if #available`                                            | SwiftData inheritance and migration |
| DM7 | Nothing in the app reads a property the current schema does not have                                                    | build with the current schema; the compiler finds the rest                   | SwiftData migrations                |

## Why each one

**DM3 is the whole point.** A migration that has never run against real
previous-version data is a guess that executes on a user's device, once, with
their data. The test is the only place it can fail safely.

**DM4 is the opposite failure and it is common.** Declaring a version for a
change SwiftData would have handled inline has produced a duplicate-checksum
crash on device. More versions is not more safety.

**DM5 is about the first launch after an update.** A migration that takes eight
seconds on a realistic store is an app that looks broken. Measuring it once in
a test costs nothing; discovering it in a review costs a release.
