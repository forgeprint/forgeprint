# Room migrations

A local database outlives every build that wrote to it. An app update meets
whatever schema the user's last version left, and a migration that is missing
or wrong is found on their device, with their data.

| #   | Check                                                                                                                  | How                                                                                 | Source                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| RM1 | The schema is exported to a committed directory, set with the Room Gradle plugin's `schemaDirectory`                   | read `build.gradle.kts`; `git ls-files app/schemas` lists one JSON per version      | Room — migrating databases; Room 2.8.5 / 3.0.3       |
| RM2 | No `exportSchema = false`                                                                                              | `grep -rn "exportSchema = false" src/main` returns nothing                          | Room — migrating databases                           |
| RM3 | Every version step has an `AutoMigration` or a registered `Migration`                                                  | compare `@Database(version = N)` with `autoMigrations` and `addMigrations(...)`     | Room — migrating databases                           |
| RM4 | Renames and deletes in an `AutoMigration` carry an `AutoMigrationSpec`                                                 | read each spec for `@RenameColumn`, `@RenameTable`, `@DeleteColumn`, `@DeleteTable` | Room — migrating databases                           |
| RM5 | A `MigrationTestHelper` test migrates from every shipped version to the current one                                    | `grep -rn "MigrationTestHelper" src/androidTest src/test`                           | Room — migrating databases                           |
| RM6 | No `fallbackToDestructiveMigration()`; a narrower variant only with a written reason                                   | `grep -rn "fallbackToDestructiveMigration" src/main`                                | Room — migrating databases                           |
| RM7 | DAO functions are `suspend` or return `Flow`; no `allowMainThreadQueries()`                                            | `grep -rn "allowMainThreadQueries" src/main`; read DAO signatures                   | Room — migrating databases; Room 3.0.3 release notes |
| RM8 | A migration from Room 2 (`androidx.room`) to Room 3 (`androidx.room3`) is a planned change with its own migration plan | read `libs.versions.toml`; mixing both packages is a finding                        | Room 3.0.3 release notes                             |

## Why each one

**RM6** is refused outright. When a migration path is missing,
`fallbackToDestructiveMigration()` recreates the database — Room's own
documentation says it permanently deletes all user data. It turns a developer
mistake into a user's loss, silently.

**RM1 and RM5** are what make migrations testable at all. Without the exported
JSON for each version there is nothing for `MigrationTestHelper` to start
from, and the only test of the migration is production.

**RM8** because Room 3 moved packages and dropped `SupportSQLite` for
`SQLiteDriver`; it is a migration of the data layer, not a version bump.
