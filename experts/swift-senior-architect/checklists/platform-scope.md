# Platform scope

Swift runs in more places than it used to, and each one costs something. The
architect decides what is shared, and writes down what is not.

| #   | Check                                                                                                      | How                                                                                         | Source                      |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| PS1 | What is shared across platforms is a named list of modules, not "whatever compiles"                        | read the module graph against the platform list                                             | SE-0386                     |
| PS2 | A shared module has no platform-only import, and a platform module is not imported by a shared one         | `grep -rn "import UIKit\|import AppKit\|import SwiftUI" Sources` against the shared targets | SE-0386                     |
| PS3 | Android support, if claimed, names the SDK and the NDK the build uses                                      | read the CI job                                                                             | Swift on Android            |
| PS4 | WebAssembly support, if claimed, names the Swift SDK and what the module may not use there                 | read the build configuration                                                                | Swift SDK for WebAssembly   |
| PS5 | An embedded target's restriction warnings are configured deliberately, not left at whatever the default is | read `Package.swift` for `.treatWarning("EmbeddedRestrictions", as:)`                       | Embedded Swift restrictions |
| PS6 | `@available` marks what is new, and the deployment target is a decision with a date                        | `grep -rn "@available" Sources`; read the deployment target                                 | Xcode 27                    |
| PS7 | A platform the project does not support is absent from the manifest rather than present and untested       | read `platforms:` in `Package.swift` against the CI matrix                                  | SE-0386                     |

## Why each one

**PS2 is the whole checklist in one row.** A shared module that imports SwiftUI
is not shared; it is a UI module with aspirations, and the day somebody builds
it for Android or Wasm is the day they find out.

**PS7 is about honesty in the manifest.** A declared platform that nothing
builds for is a claim, and claims in a manifest are what other people plan
against. Declaring less is free.

**PS3 and PS4 exist because both became reasonable in Swift 6.4** — the Android
SDK is built with NDK 30 and Swift Build supports Android in SwiftPM, and the
Wasm SDK is published on swift.org. "Reasonable" is not "free": each adds a CI
job and a set of APIs the shared modules may not use, which is what PS1 is a
list of.
