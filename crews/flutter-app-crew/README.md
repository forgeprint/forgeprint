# Flutter App Crew

_Assembled by @aliosmanmho_

Four experts for building a Flutter app of more than one screen: the layers
are packages before the first widget exists, the analyzer gate is strict,
rebuilds stay local and heavy work leaves the UI isolate, a screen reader is
tried on a device, and the journeys on an emulator fail when they flake.

It is a Flutter crew. The catalog has one mobile expert per stack
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D21), and
a crew for "mobile" would have to pick one: `mobile-app-crew` picked React
Native and says so in its `not_for`. This one picks Flutter, and adds the
architect that stack brings with it.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                                                                                                        | The question it asks first                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`dart-senior-architect`](../../experts/dart-senior-architect/SKILL.md)       | Layers as packages in a pub workspace, a pubspec that says what may import what, a written codegen policy, FFI behind one package                     | Which package is allowed to import this one              |
| [`flutter-mobile-engineer`](../../experts/flutter-mobile-engineer/SKILL.md)   | A strict analyzer gate, rebuilds that stay local, heavy work off the UI isolate, one state approach chosen in writing, a label on every tappable node | Does this rebuild the subtree or the screen              |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md) | An independent audit on a device, each finding naming a success criterion                                                                             | Does the screen reader say what this control is and does |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)             | Journeys that test behaviour rather than implementation, determinism, and the gate                                                                    | Would the suite notice if sign-in stopped working        |

**Two checkers.** The engineer runs its own semantics pass on every changed
flow; the specialist audits independently, naming a WCAG 2.2 AA success
criterion for each finding. The QA lead owns the journeys and the gate. The
engineer builds and does not mark its own work done.

One limit, stated rather than hidden: the accessibility specialist's method is
written for the web — browser screen readers, keyboard, zoom. On Flutter
screens it applies the same success criteria and the same manual passes with
TalkBack and VoiceOver, and where a criterion has no clear native equivalent
the finding says so instead of guessing.

## What they install

| Integration                                             | Why this crew wants it                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`mobile-mcp`](../../integrations/mobile-mcp/README.md) | Drives the emulator or device for the journeys and the manual accessibility passes |

Third-party software with wide reach: it controls every simulator, emulator
and USB-connected device on the machine, installs and uninstalls apps, and
reads device logs. Disconnect personal devices before using it, and read its
README first.

## The order they are useful in

1. **Architect first**, because a package boundary is cheap to draw and
   expensive to move: the pub workspace, which package may import which, and
   whether generated code is in the gate or has its own test.
2. **Mobile engineer second**: the analyzer gate, the state approach written
   down, rebuild scope, and heavy work in an isolate.
3. **Accessibility specialist third**, on a device: labels, roles, focus
   order, text scaling, target size.
4. **QA lead last**: the journeys on an emulator, a flaky test treated as a
   failed one, the gate.

They disagree in three places, and each disagreement is useful because it is
written in their own checklists rather than invented here:

- **Packages against widget trees.** The architect's `package-layering` and
  `pub-workspace` want layers as separate packages; the engineer's
  `state-and-routing` and `rebuild-discipline` want state near the widgets
  that read it. Both hold when packages are boundaries for domain code and
  the widget tree stays in the app package.
- **Generated code against a strict analyzer.** `codegen-policy` says
  generated output has a written policy and a test; `analysis-gate` says the
  gate refuses a warning. A gate that lints generated files fails on code
  nobody wrote, so the policy decides what is excluded and the test is what
  holds it.
- **Isolates against determinism.** The engineer moves heavy work off the UI
  isolate; the QA lead's `determinism` refuses a test that sleeps and hopes.
  The work has to expose a completion signal the journey can await, which is
  a design decision the engineer makes because the QA lead asked.

## Why four, in sequence

- Kim et al. measured sequential work getting 39% to 70% worse with more
  agents. Building an app is sequential — boundaries, code, audit, gate — so
  the members hand over in order rather than working at once.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The device audit and the gate are two verifications by members who did not
  write the screen.

## Where this crew is wrong

- **A React Native app.** That is [`mobile-app-crew`](../mobile-app-crew/README.md).
- **A native Android app.** That is `android-app-crew`.
- **The release.** No member writes a version, a changelog or a withdrawal
  plan. That is [`release-crew`](../release-crew/README.md), and a store build
  should wait for it.
- **Backend work.** Nothing here writes a server.
- **A change to one screen.** Small, same-file work for the mobile engineer
  alone.

## How to use it

Ask your agent for the crew by name. Start with the architect even when the
app is small: the pub workspace and the import rules are the two decisions
that are expensive to take back.
