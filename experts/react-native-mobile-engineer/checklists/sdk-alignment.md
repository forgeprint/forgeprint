# SDK alignment

An Expo app is JavaScript on top of a native binary, and the two are built from
different version numbers. The SDK is the contract between them; every row here
keeps the JavaScript on the versions that contract names.

| #   | Check                                                                                       | How                                                                                     | Source                                 |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| SA1 | `npx expo install --check` passes                                                           | run it; it exits non-zero on a mismatched package                                       | Expo CLI — `install --check`           |
| SA2 | That check runs where merges are gated, not only on request                                 | read the CI workflow or the pre-merge script                                            | Expo CLI — `install --check`           |
| SA3 | Expo and React Native packages were added with `npx expo install`, not a bare `npm install` | compare `package.json` against `expo/bundledNativeModules.json` for the installed SDK   | Expo SDK 57 — `bundledNativeModules`   |
| SA4 | `npx expo-doctor` reports no issue before a release build                                   | run it                                                                                  | expo-doctor 1.20                       |
| SA5 | `tsconfig.json` extends `expo/tsconfig.base` and `strict` is on; `tsc --noEmit` exits 0     | `npx tsc --showConfig \| grep strict`; `npx tsc --noEmit`                               | Expo SDK 57 — tsconfig; TypeScript 6.0 |
| SA6 | No native library that requires the legacy architecture                                     | read each native dependency's README and changelog for New Architecture support         | RN 0.82 — New Architecture only        |
| SA7 | No `newArchEnabled: false` anywhere                                                         | `grep -rn "newArchEnabled" app.json app.config.* android/gradle.properties 2>/dev/null` | RN 0.82 — New Architecture only        |
| SA8 | A release build runs on Hermes                                                              | in a release build on a device, `global.HermesInternal` is defined                      | RN 0.87 — Hermes                       |
| SA9 | No `// @ts-ignore` or `as any` on a native module call or navigation param                  | `grep -rnE "@ts-ignore\|as any" app src components`                                     | TypeScript 6.0 — strict                |

## Why each one

**SA3** is the row the other rows exist to protect. Expo SDK 57 bundles
React Native 0.86.3 and FlashList 2.0.2; npm `latest` on the day this was
written was 0.87.1 and 2.3.2. `npm install` picks the second number, the app
compiles, and the native side fails at runtime on a module the SDK never built.

**SA1 and SA2** turn that into an exit code. A drift nobody's CI notices is
found by the first user on the next store build.

**SA8** because Hermes being the default is not the same as a release build
using its precompiled bytecode; the Hermes page itself warns that the global
can be present without the benefit.
