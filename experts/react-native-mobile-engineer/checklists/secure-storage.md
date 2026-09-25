# Secure storage

A phone is lost, backed up, shared and inspected. What the app writes to it, and
what it ships inside its bundle, is readable by whoever ends up holding it
unless the platform keystore protects it.

| #   | Check                                                                                                    | How                                                                                     | Source                                   |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| SS1 | Tokens, passwords and keys are stored with `expo-secure-store`, never AsyncStorage                       | `grep -rnE "AsyncStorage\.setItem\(" app src` and read every key name                   | RN 0.87 — Security; MASVS-STORAGE-1      |
| SS2 | No secret in an `EXPO_PUBLIC_` variable                                                                  | `grep -rn "EXPO_PUBLIC_" .env* app.config.* app src`; each is safe to publish           | Expo — environment variables; MASWE-0004 |
| SS3 | No API key, client secret or private key in source or `app.json`                                         | `grep -rnE "(api[_-]?key\|secret\|private[_-]?key)\s*[:=]" app src app.json`            | RN 0.87 — Security; MASWE-0004           |
| SS4 | A secure-store value is a token or a key, not a document                                                 | read each `setItemAsync` call; values that can grow beyond about 2 KB are refused       | expo-secure-store 57                     |
| SS5 | Sign-out deletes every secure-store entry it created                                                     | read sign-out for `deleteItemAsync` on each key; iOS Keychain entries survive uninstall | expo-secure-store 57                     |
| SS6 | `requireAuthentication` guards values that need a biometric, and the iOS Face ID usage string is present | read the call and `app.json` `ios.infoPlist.NSFaceIDUsageDescription`                   | expo-secure-store 57; MASVS-AUTH-2       |
| SS7 | No token, password or personal data reaches `console.log` in a release build                             | `grep -rn "console\.\(log\|info\|debug\)" app src` and read what each prints            | MASWE-0005; MASVS-STORAGE-2              |
| SS8 | Network calls use `https://`; no cleartext exception in the Android manifest or iOS ATS settings         | `grep -rn "http://" app src app.json`; read `usesCleartextTraffic` and ATS keys         | MASVS-NETWORK-1; MASWE-0026              |

## Why each one

**SS1** because AsyncStorage is, in React Native's own words, an unencrypted
key-value store. A refresh token there is readable from a device backup or a
rooted phone, and the account behind it is open until the token expires.

**SS2 and SS3** are the same failure from two directions. `EXPO_PUBLIC_` values
are inlined into the JavaScript bundle; anything in source is too. A key that
ships in a binary is a published key. It belongs on a server the app calls.

**SS5** is iOS-specific and surprising: a Keychain entry survives an uninstall,
so a user who deletes the app and reinstalls it can find themselves signed in
as whoever used it before.
