# iOS App Crew

_Assembled by @aliosmanmho_

Four experts for building a SwiftUI app of more than one screen: the module
boundaries drawn with `package` rather than `public`, each target declaring the
actor isolation it wants, views driven by observation rather than by
annotations, secrets in the Keychain with an accessibility class, VoiceOver
tried on a device, and the journeys run against the build that ships.

It is an Apple crew. The catalog has one mobile expert per stack
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D21), and a
crew for "mobile" would have to pick one: `mobile-app-crew` picked React
Native, [`flutter-app-crew`](../flutter-app-crew/README.md) and
[`android-app-crew`](../android-app-crew/README.md) took the next two. This one
takes Swift, and adds the architect that stack brings with it.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                                                                                                                                    | The question it asks first                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`swift-senior-architect`](../../experts/swift-senior-architect/SKILL.md)     | Modules as boundaries with `internal` as the wall, `package` instead of `public`, a public API diffed against the last tag, evolution mode off unless something ships as a binary | Which module is allowed to see this type                 |
| [`swift-mobile-engineer`](../../experts/swift-mobile-engineer/SKILL.md)       | A default isolation per target, `@Observable` models read where they are needed, a Keychain accessibility class, a test behind every custom migration stage                       | Does this rebuild the row or the screen                  |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md) | An independent audit on a device, each finding naming a success criterion                                                                                                         | Does the screen reader say what this control is and does |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)             | Journeys that test behaviour rather than implementation, determinism, and the gate                                                                                                | Would the suite notice if sign-in stopped working        |

**Two checkers.** The engineer runs its own semantics pass on every changed
screen; the specialist audits independently with VoiceOver, naming a WCAG 2.2
AA success criterion for each finding. The QA lead owns the journeys and the
gate. The engineer builds and does not mark its own work done.

One limit, stated rather than hidden: the accessibility specialist's method is
written for the web — browser screen readers, keyboard, zoom. On SwiftUI
screens it applies the same success criteria with VoiceOver and Dynamic Type,
and where a criterion has no clear native equivalent the finding says so
instead of guessing.

## What they install

| Integration                                             | Why this crew wants it                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`mobile-mcp`](../../integrations/mobile-mcp/README.md) | Drives the simulator or device for the journeys and the manual VoiceOver passes |

Third-party software with wide reach: it controls every simulator, emulator and
USB-connected device on the machine, installs and uninstalls apps, and reads
device logs. Disconnect personal devices before using it, and read its README
first.

## The order they are useful in

1. **Architect first**, because a module boundary is cheap to draw and
   expensive to move: which targets exist, what `package` keeps in, each
   target's default actor isolation, and whether anything ships as a binary.
2. **Mobile engineer second**: the views and the models, the Keychain, the
   migrations, the format gate.
3. **Accessibility specialist third**, on a device: labels, traits, focus
   order, Dynamic Type, target size.
4. **QA lead last**: the journeys, a flaky test treated as a failed one, the
   gate.

They disagree in three places, and each one is written in their own checklists
rather than invented here:

- **Testing through the boundary, or around it.** The architect's
  `module-boundaries` keeps test targets out of package symbols
  (`packageAccess: false`) and `@testable import` in tests only; the QA lead's
  `behaviour-not-implementation` wants tests that survive a refactor. Both hold
  when the journeys go through the surface the app itself uses — and when they
  cannot, the boundary is in the wrong place, which is a finding rather than a
  reason to widen access.
- **The audit needs an app this architecture does not contain.** The engineer's
  `accessibility-audit` wants `performAccessibilityAudit()` on every screen a
  user can reach, and that needs an app to launch; the architect's boundaries
  put the screens in a package. **The app shell is the QA lead's**: the UI test
  target lives there, the package holds the labels that make the audit pass, and
  neither pretends the other will do it. This is the disagreement most likely to
  be discovered late, because a package can be green with no audit anywhere.
- **A gate whose tool is known to miss things.** The architect's `api-surface`
  runs `swift package diagnose-api-breaking-changes` and names its open issues —
  no access-level filter, a missed protocol default `associatedtype`, a
  defaulted parameter reported as a break. The QA lead wires gates and treats a
  green one as evidence. Here it is not: the architect reads the output, and the
  gate's job is to make sure somebody does.

## Why four, in sequence

- Kim et al. measured sequential work getting 39% to 70% worse with more
  agents. Building an app is sequential — boundaries, code, audit, gate — so the
  members hand over in order rather than working at once.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The device audit and the gate are two verifications by members who did not
  write the screen.

## Where this crew is wrong

- **A Flutter app.** That is [`flutter-app-crew`](../flutter-app-crew/README.md).
- **A React Native app.** That is [`mobile-app-crew`](../mobile-app-crew/README.md).
- **A native Android app.** That is [`android-app-crew`](../android-app-crew/README.md).
- **The release.** No member writes a version, a changelog or a withdrawal
  plan. That is [`release-crew`](../release-crew/README.md), and an App Store
  submission should wait for it.
- **Server-side Swift.** The architect covers the language; nothing here knows
  about routing, persistence or deployment.
- **A change to one screen.** Small, same-file work for the mobile engineer
  alone.

## How to use it

Ask your agent for the crew by name. Start with the architect even when the app
is small: the module graph and each target's isolation default are the two
decisions that are expensive to take back. And decide where the app shell lives
before the first screen, because the accessibility audit has nowhere to run
until it does.
