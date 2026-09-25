# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Package versions were read from the npm registry, and SDK contents from the
published `expo` package, on the date shown. Where a page carries no version,
the row says so rather than inventing one. **Re-check every 90 days**, and
sooner when Expo SDK 58 is released: most rows here move with the SDK.

> **Next re-check due: 2026-12-24.**

## Platform and tooling

| Short name                                  | Reference                                                                                           | Version                                                                                                                                                                   | Checked    | Used for                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Expo SDK 57 — `bundledNativeModules`        | [`expo` on npm](https://www.npmjs.com/package/expo), file `bundledNativeModules.json`               | `expo` 57.0.25 (SDK 57, first released 2026-06-30): `react-native` 0.86.3, `react` 19.2.3, `@shopify/flash-list` 2.0.2, `@react-native-async-storage/async-storage` 2.2.0 | 2026-09-25 | SKILL.md §1; SA3                                                                |
| Expo SDK 57 — tsconfig                      | [`expo/tsconfig.base.json`](https://www.npmjs.com/package/expo) and `expo-template-default` 57      | template pins `typescript` `~6.0.3` while npm `latest` is 7.0.2                                                                                                           | 2026-09-25 | SA5                                                                             |
| TypeScript 6.0                              | [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)   | 6.0.3                                                                                                                                                                     | 2026-09-25 | SA5, SA9 — `strict`                                                             |
| Expo CLI — `install --check`                | [Expo CLI](https://docs.expo.dev/more/expo-cli/)                                                    | current at check                                                                                                                                                          | 2026-09-25 | SKILL.md §1; SA1, SA2: `--check` exits non-zero in CI, `--fix` corrects         |
| expo-doctor 1.20                            | [`expo-doctor` on npm](https://www.npmjs.com/package/expo-doctor)                                   | 1.20.4 (npm `latest`)                                                                                                                                                     | 2026-09-25 | SA4                                                                             |
| RN 0.82 — New Architecture only             | [React Native 0.82 — A New Era](https://reactnative.dev/blog/2025/10/08/react-native-0.82)          | 0.82, 2025-10-08                                                                                                                                                          | 2026-09-25 | SKILL.md §1; SA6, SA7: the first release that runs only on the New Architecture |
| RN 0.87 — Hermes                            | [Using Hermes](https://reactnative.dev/docs/hermes)                                                 | docs 0.87; npm `react-native` `latest` 0.87.1                                                                                                                             | 2026-09-25 | SA8: Hermes is the default; `HermesInternal` does not prove bytecode is used    |
| RN 0.87 — Optimizing FlatList configuration | [Optimizing FlatList configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration) | docs 0.87                                                                                                                                                                 | 2026-09-25 | SKILL.md §2; LR1–LR5, LR10                                                      |
| FlashList 2 — usage                         | [FlashList usage](https://shopify.github.io/flash-list/docs/usage)                                  | docs 2.x; npm `latest` 2.3.2, SDK 57 bundles 2.0.2                                                                                                                        | 2026-09-25 | LR2, LR7, LR8, LR9                                                              |
| FlashList 2 — what's new in v2              | [What's new in v2](https://shopify.github.io/flash-list/docs/v2-changes)                            | docs 2.x                                                                                                                                                                  | 2026-09-25 | LR6: `estimatedItemSize` and the other estimates are no longer used             |

## Storage, links and security

| Short name                   | Reference                                                                                                                                                                                                               | Version                                        | Checked    | Used for                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| RN 0.87 — Security           | [Security](https://reactnative.dev/docs/security)                                                                                                                                                                       | docs 0.87                                      | 2026-09-25 | SKILL.md §3, §4; SS1, SS3, DL4, DL6: AsyncStorage is unencrypted; custom schemes can be hijacked     |
| expo-secure-store 57         | [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)                                                                                                                                                   | SDK 57; npm 57.0.4                             | 2026-09-25 | SS4, SS5, SS6: the ~2048-byte warning, Keychain entries surviving uninstall, `requireAuthentication` |
| Expo — environment variables | [Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/)                                                                                                                                    | current at check                               | 2026-09-25 | SS2: `EXPO_PUBLIC_` values are inlined in plain text                                                 |
| Expo — linking into your app | [Linking into your app](https://docs.expo.dev/linking/into-your-app/), [Android App Links](https://docs.expo.dev/linking/android-app-links/), [iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/) | current at check                               | 2026-09-25 | DL2 (`npx uri-scheme open`, `uri-scheme` 2.2.0), DL5 (`autoVerify`, `associatedDomains`)             |
| Android App Links            | [About App Links](https://developer.android.com/training/app-links)                                                                                                                                                     | last updated 2026-09-16                        | 2026-09-25 | DL5: verified links versus custom schemes                                                            |
| MASVS 2.1.0                  | [OWASP MASVS](https://mas.owasp.org/MASVS/)                                                                                                                                                                             | v2.1.0 (released 2024-01-18; latest on GitHub) | 2026-09-25 | Control IDs in SS, DL, OT: STORAGE-1/2, AUTH-2, NETWORK-1, PLATFORM-1/2, CODE-2, CODE-4              |
| MASWE 1.0.0                  | [OWASP MAS Weakness Enumeration](https://mas.owasp.org/MASWE/)                                                                                                                                                          | v1.0.0 (released 2026-08-17)                   | 2026-09-25 | MASWE-0001, 0004, 0005, 0026, 0029, 0035 in SKILL.md §7 and the checklists                           |
| MASTG 2.0.0                  | [OWASP MASTG](https://mas.owasp.org/MASTG/)                                                                                                                                                                             | v2.0.0 (released 2026-06-30, first stable v2)  | 2026-09-25 | The test procedures behind the MASWE rows; the depth `security-reviewer` owns                        |

## Accessibility

WCAG 2.2 is tracked in [`docs/review-standards.md`](../../docs/review-standards.md),
the catalog's copy of record; it is not restated here.

| Short name                | Reference                                                                                                     | Version                                  | Checked    | Used for                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- | ------------------------------------------------------- |
| RN 0.87 — Accessibility   | [Accessibility](https://reactnative.dev/docs/accessibility)                                                   | docs 0.87                                | 2026-09-25 | SKILL.md §5; RA1–RA3, RA7, RA8, RA10                    |
| RN 0.87 — Text            | [Text](https://reactnative.dev/docs/text)                                                                     | docs 0.87                                | 2026-09-25 | RA4: `allowFontScaling`, `maxFontSizeMultiplier`        |
| WCAG2Mobile               | [Guidance on Applying WCAG 2.2 to Mobile Applications](https://www.w3.org/TR/wcag2mobile-22/)                 | W3C Group Draft Note, 2025-05-06         | 2026-09-25 | RA4, RA5, RA9: how 1.4.4 and 1.3.4 read in a native app |
| Apple HIG — Buttons       | [Human Interface Guidelines — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | no version on the page; current at check | 2026-09-25 | RA6: a hit region of at least 44 by 44 pt               |
| Android — accessible apps | [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps)                 | last updated 2026-09-22                  | 2026-09-25 | RA6: touch targets of at least 48 by 48 dp              |

## Tests and updates

| Short name                    | Reference                                                                                       | Version                                  | Checked    | Used for                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Expo — unit testing           | [Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/)                           | current at check                         | 2026-09-25 | OT1, OT2: `jest-expo` preset; `react-test-renderer` does not support React 19 |
| jest-expo 57                  | [`jest-expo` on npm](https://www.npmjs.com/package/jest-expo)                                   | 57.0.5                                   | 2026-09-25 | OT1                                                                           |
| RNTL 14                       | [React Native Testing Library](https://oss.callstack.com/react-native-testing-library/)         | 14.0.1 (npm `latest`)                    | 2026-09-25 | OT2                                                                           |
| RNTL 14 — how to query        | [How to query](https://oss.callstack.com/react-native-testing-library/docs/guides/how-to-query) | docs 14.x                                | 2026-09-25 | OT3: role, then text, then `testID` last                                      |
| EAS Update — runtime versions | [Runtime versions and updates](https://docs.expo.dev/eas-update/runtime-versions/)              | current at check; `expo-updates` 57.0.23 | 2026-09-25 | SKILL.md §6; OT5, OT6, OT8: the `fingerprint` policy                          |
| EAS Update — rollbacks        | [Rollbacks](https://docs.expo.dev/eas-update/rollbacks/)                                        | current at check                         | 2026-09-25 | OT7: `eas update:rollback`                                                    |

## Deferred to elsewhere

- A MASVS security audit, pinning, resilience and the threat model:
  [`security-reviewer`](../security-reviewer/SKILL.md), against
  `docs/review-standards.md`.
- A full accessibility audit with assistive technology: the
  `accessibility-specialist` expert, planned and not yet written.
- Profiling, startup time and memory: [`performance-engineer`](../performance-engineer/SKILL.md).
- Device-farm strategy and end-to-end suites: [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
