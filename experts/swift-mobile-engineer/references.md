# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Swift and Xcode versions were read from swift.org and Apple's release pages,
tool versions from each project's latest GitHub release, and the OWASP MAS
versions from the OWASP release pages, on the dates shown. **Re-check every 90
days**, and when the next Xcode minor ships a new Swift.

> **Next re-check due: 2026-01-06.**

## Language and toolchain

| Short name           | Reference                                                                                                                                                             | Version                                                                                                                                                        | Checked    | Used for                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Swift 6.4            | [Swift 6.4 released](https://www.swift.org/blog/swift-6.4-released/)                                                                                                  | 6.4, released 2026-09-15                                                                                                                                       | 2026-10-08 | The target in SKILL.md §1                                              |
| Xcode 27             | [Apple Developer — Releases](https://developer.apple.com/news/releases/)                                                                                              | 27 (27A266a), 2026-09-14; ships Swift 6.4; language modes 6, 5, 4.2, 4                                                                                         | 2026-10-08 | SKILL.md §1; BG1: the compiler an app build actually uses              |
| SE-0466              | [Control default actor isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0466-control-default-actor-isolation.md)                           | implemented in Swift 6.2; `-default-isolation MainActor\|nonisolated`, `SwiftSetting.defaultIsolation(MainActor.self)`; a module with neither is `nonisolated` | 2026-10-08 | AI1, AI2, AI3                                                          |
| SE-0461              | [Run nonisolated async functions on the caller's actor by default](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0461-async-function-isolation.md) | Swift 6.2 upcoming feature, in the approachable-concurrency group                                                                                              | 2026-10-08 | AI4, AI5                                                               |
| SE-0506              | [Advanced observation tracking](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0506-advanced-observation-tracking.md)                               | Swift 6.4                                                                                                                                                      | 2026-10-08 | OS6: continuous change notifications for `@Observable`                 |
| ST-0021              | [Swift 6.4 release notes, testing section](https://www.swift.org/blog/swift-6.4-released/)                                                                            | Swift 6.4: `XCTAssert` works in Swift Testing tests and `#expect` in XCTests                                                                                   | 2026-10-08 | BG5: the two frameworks may coexist, so a mixed suite is not a finding |
| swift-testing 6.4    | [swiftlang/swift-testing releases](https://github.com/swiftlang/swift-testing/releases)                                                                               | `swift-6.4.0-RELEASE`, 2026-09-15; ships with the toolchain                                                                                                    | 2026-10-08 | BG4, BG5                                                               |
| swift-format 604.0.0 | [swiftlang/swift-format releases](https://github.com/swiftlang/swift-format/releases)                                                                                 | 604.0.0, 2026-09-16 (the 6xx line tracks Swift 6.4)                                                                                                            | 2026-10-08 | BG2                                                                    |
| SwiftLint 0.65.1     | [realm/SwiftLint releases](https://github.com/realm/SwiftLint/releases)                                                                                               | 0.65.1, 2026-08-21                                                                                                                                             | 2026-10-08 | BG3. Optional: `swift-format` alone satisfies BG2                      |

## Platform APIs

| Short name                          | Reference                                                                                                      | Version                                                                                                                                                                                                                                          | Checked    | Used for                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------- |
| Accessibility audits                | [Perform accessibility audits for your app](https://developer.apple.com/videos/play/wwdc2023/10035/)           | WWDC23; `XCUIApplication.performAccessibilityAudit()`, iOS 17+; audit types `contrast`, `elementDetection`, `hitRegion`, `sufficientElementDescription`, `dynamicType`, `textClipped`, `trait`; a failing check fails the test with no assertion | 2026-10-08 | AA1, AA2, AA3, AA7                       |
| SwiftData migrations                | [Model your schema with SwiftData](https://developer.apple.com/videos/play/wwdc2023/10195)                     | WWDC23: `VersionedSchema` per version, ordered in a `SchemaMigrationPlan`; lightweight stages need no code, a uniqueness change needs a custom stage with `willMigrate`/`didMigrate`                                                             | 2026-10-08 | DM1, DM2, DM3, DM4                       |
| SwiftData inheritance and migration | [SwiftData: Dive into inheritance and schema migration](https://developer.apple.com/videos/play/wwdc2025/291/) | WWDC25: a plan may append a later schema behind `if #available`                                                                                                                                                                                  | 2026-10-08 | DM6                                      |
| Swift API Design Guidelines         | [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)                      | current page                                                                                                                                                                                                                                     | 2026-10-08 | SKILL.md §5: naming at a module boundary |

## Security

The catalog tracks OWASP centrally in
[`docs/review-standards.md`](../../docs/review-standards.md); these are the
mobile-specific documents it does not, and the versions were re-checked for
this expert rather than carried.

| Short name  | Reference                                                      | Version                                              | Checked    | Used for                                                                                                       |
| ----------- | -------------------------------------------------------------- | ---------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| MASVS 2.1.0 | [OWASP MASVS](https://mas.owasp.org/MASVS/)                    | v2.1.0 (2024-01-18; still the latest release)        | 2026-10-08 | SS2, SS4, SS6: STORAGE-1/2, PLATFORM-2                                                                         |
| MASWE 1.0.0 | [OWASP MAS Weakness Enumeration](https://mas.owasp.org/MASWE/) | v1.0.0, 2026-08-17; 78 weaknesses with permanent IDs | 2026-10-08 | SS3, SS5: MASWE-0001, MASWE-0004, MASWE-0006                                                                   |
| MASTG 2.0.0 | [OWASP MASTG](https://mas.owasp.org/MASTG/)                    | v2.0.0, 2026-06-30                                   | 2026-10-08 | The test procedures behind the MASWE rows; the depth [`security-reviewer`](../security-reviewer/SKILL.md) owns |

## What is deliberately not cited here

- **Keychain accessibility constants by name and availability.** Apple's
  reference pages render client-side and could not be read on the date above,
  so SS1 and SS2 name the mechanism and cite MASVS and MASWE for the
  requirement instead of asserting a version this expert did not verify. The
  constant to reach for is still
  `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`; read the page before quoting
  its availability.
- **WCAG success criteria.** Tracked centrally in
  [`docs/review-standards.md`](../../docs/review-standards.md). AA5 and AA6
  point there rather than restating them, and the independent audit belongs to
  [`accessibility-specialist`](../accessibility-specialist/SKILL.md).
