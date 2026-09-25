# Keystore and permissions

What the app stores, what it ships inside the APK and what it asks the user to
allow are the three places an Android app hands out access. The platform has a
right answer for each, and one of them changed recently.

| #    | Check                                                                                                           | How                                                                                                              | Source                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| KP1  | No new use of `EncryptedSharedPreferences`, `EncryptedFile` or `MasterKey`                                      | `grep -rnE "EncryptedSharedPreferences\|EncryptedFile\|MasterKey" src/main`; existing hits have a migration item | security-crypto 1.1.0 release notes                    |
| KP2  | Secrets are encrypted with a non-exportable Android Keystore key and stored as ciphertext                       | read the key generation for `KeyGenParameterSpec` and the storage for plain-text tokens                          | Android Keystore system; MASVS-STORAGE-1               |
| KP3  | Keys that guard sensitive actions require user authentication (`setUserAuthenticationParameters`)               | read the `KeyGenParameterSpec` builder                                                                           | Android Keystore system; MASVS-AUTH-2                  |
| KP4  | No token or secret in `SharedPreferences` or DataStore in plain text                                            | `grep -rn "putString\|stringPreferencesKey" src/main`; read what each key holds                                  | MASWE-0001; MASVS-STORAGE-1                            |
| KP5  | No API key or secret in `BuildConfig`, `strings.xml`, `gradle.properties` values that ship, or assets           | `grep -rnE "buildConfigField\|resValue" *.gradle.kts`; `grep -rniE "api[_-]?key\|secret" src/main/res`           | MASWE-0004                                             |
| KP6  | Backup rules exclude anything encrypted with a device-bound key                                                 | read `android:allowBackup`, `dataExtractionRules` and `fullBackupContent` in the manifest                        | MASWE-0006; MASVS-STORAGE-2                            |
| KP7  | Runtime permissions are requested when the user reaches the feature, via the `RequestPermission` contract       | `grep -rn "RequestPermission\|requestPermissions(" src/main`; none in `onCreate` of the launcher                 | Android — request runtime permissions                  |
| KP8  | A rationale is shown when `shouldShowRequestPermissionRationale` is true, and denial disables only that feature | read each request site                                                                                           | Android — request runtime permissions                  |
| KP9  | The manifest declares no permission the code does not use                                                       | compare `<uses-permission>` entries with the API calls that need them                                            | MASVS-PRIVACY-1; Android — request runtime permissions |
| KP10 | No `usesCleartextTraffic="true"`; any cleartext exception is scoped in a network security config                | `grep -rn "usesCleartextTraffic\|cleartextTrafficPermitted" src/main`                                            | MASVS-NETWORK-1; MASWE-0026                            |

## Why each one

**KP1** is the row that changed. `androidx.security:security-crypto` 1.1.0
deprecated all of its APIs in favour of platform APIs and direct use of the
Android Keystore. A great deal of existing guidance, and most generated code,
still reaches for `EncryptedSharedPreferences`; this expert does not add new
uses, and treats existing ones as a migration to plan.

**KP5** because `BuildConfig` fields and resources are compiled into the APK
in readable form. A key an app needs to call a third-party API belongs on a
server the app calls.

**KP7** because a permission asked at launch has no context for the user to
judge it by, and the app that is denied has nothing to fall back to.
