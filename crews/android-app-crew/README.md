# Android App Crew

_Assembled by @aliosmanmho_

Four experts for building a native Android app in Kotlin and Compose: the
Gradle modules are the boundaries and the public API is dumped and checked,
state is hoisted and flows stop with the lifecycle, migrations are tested and
keys stay in the Keystore, TalkBack is tried on a device, and the journeys run
against the build that ships rather than the one that is convenient.

It is an Android crew. The catalog has one mobile expert per stack
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D21), and
a crew for "mobile" would have to pick one: `mobile-app-crew` picked React
Native and says so in its `not_for`. This one picks Android, and adds the
architect that stack brings with it.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                                                                                 | The question it asks first                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [`kotlin-senior-architect`](../../experts/kotlin-senior-architect/SKILL.md)   | Gradle modules as boundaries, `internal` as the wall, a dumped and checked public API, a named owner for every coroutine scope | Which module is allowed to see this type                 |
| [`android-mobile-engineer`](../../experts/android-mobile-engineer/SKILL.md)   | Hoisted state, flows that stop with the lifecycle, tested Room migrations, keys in the Keystore, R8 and a baseline profile     | What happens to this flow when the screen goes away      |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md) | An independent audit on a device, each finding naming a success criterion                                                      | Does the screen reader say what this control is and does |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)             | Journeys that test behaviour rather than implementation, determinism, and the gate                                             | Would the suite notice if sign-in stopped working        |

**Two checkers.** The engineer runs its own Compose semantics tests on every
changed screen; the specialist audits independently with TalkBack, naming a
WCAG 2.2 AA success criterion for each finding. The QA lead owns the journeys
and the gate. The engineer builds and does not mark its own work done.

One limit, stated rather than hidden: the accessibility specialist's method is
written for the web — browser screen readers, keyboard, zoom. On Compose
screens it applies the same success criteria with TalkBack and Switch Access,
and where a criterion has no clear native equivalent the finding says so
instead of guessing.

## What they install

| Integration                                             | Why this crew wants it                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`mobile-mcp`](../../integrations/mobile-mcp/README.md) | Drives the emulator or device for the instrumentation journeys and the manual TalkBack passes |

Third-party software with wide reach: it controls every simulator, emulator
and USB-connected device on the machine, installs and uninstalls apps, and
reads device logs. Disconnect personal devices before using it, and read its
README first.

## The order they are useful in

1. **Architect first**, because a module boundary is cheap to draw and
   expensive to move: the Gradle module graph, what `internal` keeps in, the
   API dump, and whether anything is shared with Kotlin Multiplatform.
2. **Mobile engineer second**: state hoisting, flow lifecycles, Room
   migrations with a test each, the Keystore, R8 and the baseline profile.
3. **Accessibility specialist third**, on a device: labels, roles, focus
   order, text scaling, target size.
4. **QA lead last**: the instrumentation journeys, a flaky test treated as a
   failed one, the gate.

They disagree in three places, and each disagreement is written in their own
checklists rather than invented here:

- **A public function against a checked API.** The architect's `api-surface`
  dumps the public API and fails the build when it changes; the engineer wants
  to call the thing it just wrote from the screen next door. Both hold when
  the default is `internal` and going public is a deliberate, reviewed change.
- **Two owners for one flow.** The engineer's `coroutines-lifecycle` stops
  collection with the lifecycle; the architect's `coroutine-ownership` asks who
  owns the scope. A ViewModel scope outlives a composition, so a flow has two
  plausible owners until somebody writes down which one it is.
- **The build the suite runs on.** The engineer ships R8 and a baseline
  profile; the QA lead's `ci-signal` wants the gate to be evidence about what
  ships. A suite that only passes on the debug build is evidence about another
  app, so the journeys run against the minified build — which costs CI time
  and is the one disagreement here that changes the pipeline.

## Why four, in sequence

- Kim et al. measured sequential work getting 39% to 70% worse with more
  agents. Building an app is sequential — boundaries, code, audit, gate — so
  the members hand over in order rather than working at once.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The device audit and the gate are two verifications by members who did not
  write the screen.

## Where this crew is wrong

- **A Flutter app.** That is [`flutter-app-crew`](../flutter-app-crew/README.md).
- **A React Native app.** That is [`mobile-app-crew`](../mobile-app-crew/README.md).
- **The release.** No member writes a version, a changelog or a withdrawal
  plan. That is [`release-crew`](../release-crew/README.md), and a Play
  release should wait for it.
- **Backend work.** Nothing here writes a server, including a Ktor one — the
  Kotlin architect covers that stack, this crew does not.
- **A change to one screen.** Small, same-file work for the mobile engineer
  alone.

## How to use it

Ask your agent for the crew by name. Start with the architect even when the
app is small: the module graph and the API dump are the two decisions that are
expensive to take back.
