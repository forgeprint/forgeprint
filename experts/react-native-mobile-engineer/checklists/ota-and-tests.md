# OTA updates and tests

Two things decide whether a change reaches users safely: tests that exercise
what the user perceives, and an update channel that cannot deliver JavaScript
to a binary without the native code it needs.

| #   | Check                                                                                                                      | How                                                                                         | Source                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| OT1 | Jest runs with `preset: "jest-expo"`                                                                                       | read `jest.config.*` or the `jest` key in `package.json`                                    | Expo — unit testing; jest-expo 57           |
| OT2 | Component tests use React Native Testing Library; `react-test-renderer` is not a dependency                                | `grep -n "react-test-renderer" package.json` returns nothing                                | Expo — unit testing; RNTL 14                |
| OT3 | Tests query by role first, then text, and `testID` only as a last resort                                                   | `grep -rnc "getByTestId" __tests__ src` against `getByRole`; each `testID` query justified  | RNTL 14 — how to query                      |
| OT4 | Every screen that reads route params has a test with a malformed param                                                     | read the tests for the routes in `deep-links.md` DL1                                        | MASVS-CODE-4                                |
| OT5 | `runtimeVersion` uses the `fingerprint` policy, or an ADR names the policy and when it is bumped                           | read `app.json` / `app.config.*` `runtimeVersion`                                           | EAS Update — runtime versions               |
| OT6 | An update reaches a staging channel and a device before the production channel                                             | read the release script or `eas.json` channels                                              | EAS Update — runtime versions               |
| OT7 | The rollback is written down before the first update: `eas update:rollback`, to a previous update or to the embedded build | the release plan names it                                                                   | EAS Update — rollbacks                      |
| OT8 | A change that adds a native module, a permission or a config plugin ships as a store build, not OTA                        | diff `package.json` native deps and `app.json` `plugins` / permissions since the last build | EAS Update — runtime versions; MASVS-CODE-2 |

## Why each one

**OT5** is the row that makes over-the-air updates safe at all. A runtime
version typed by hand and forgotten means an update that calls a new native
module is delivered to every build that says the same number, and those builds
crash on launch. The `fingerprint` policy moves the number whenever native
inputs change.

**OT3** because a test that finds a button by `testID` passes when the button
has no role and no label. A test that finds it by role fails, which is what
connects `rn-accessibility.md` to CI.

**OT7** because the moment a bad update is live is the worst moment to learn
the rollback command.
