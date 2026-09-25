# Mobile App Crew

_Assembled by @aliosmanmho_

Four experts for building and shipping a React Native app on Expo: the SDK
picks the versions, no secret reaches the bundle, a screen reader is tried on
a device, the journeys run end to end on an emulator, and every release —
store build or over-the-air update — says how it is withdrawn.

It is a React Native crew. The catalog has one mobile expert per stack
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D21), and
a crew for "mobile" would have to pick one; this one picked React Native.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                                | What it brings                                                          | The question it asks first                                |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| [`react-native-mobile-engineer`](../../experts/react-native-mobile-engineer/SKILL.md) | SDK-aligned dependencies, recycled lists, secure storage, OTA that fits | Did the SDK pick this version, or did somebody            |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md)         | An independent audit on a device, each finding with a success criterion | Does the screen reader say what this control is and does  |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)                     | End-to-end journeys on an emulator, deterministic, and the release gate | Would the suite notice if sign-in stopped working         |
| [`release-manager`](../../experts/release-manager/SKILL.md)                           | A version derived from history, a changelog, and a withdrawal plan      | How is this build withdrawn, written down before it ships |

**Two checkers.** The mobile engineer runs its own TalkBack and VoiceOver pass
on every changed flow; the accessibility specialist audits independently,
naming a WCAG 2.2 AA success criterion for every finding. The QA lead owns the
journeys and the gate. The mobile engineer builds and does not mark its own
work done.

One limit, stated rather than hidden: the accessibility specialist's method is
written for the web — browser screen readers, keyboard, zoom. On native
screens it applies the same success criteria and the same manual passes on the
device, and where a criterion has no clear native equivalent the finding says
so instead of guessing.

## What they install

| Integration                                             | Why this crew wants it                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`mobile-mcp`](../../integrations/mobile-mcp/README.md) | Drives the emulator or device for the journeys and the manual accessibility passes |

Third-party software with wide reach: it controls every simulator, emulator
and USB-connected device on the machine, installs and uninstalls apps, and
reads device logs. Disconnect personal devices before using it, and read its
README first.

## The order they are useful in

1. **Mobile engineer first**: the Expo SDK and the versions it chooses,
   secrets out of AsyncStorage and the bundle, lists that recycle.
2. **Accessibility specialist second**, on a device: labels, roles, focus
   order, text scaling, target size.
3. **QA lead third**: the journeys on an emulator, a flaky test treated as a
   failed one, the gate.
4. **Release manager last**: the version, the changelog, and a withdrawal plan
   for the store build and for any OTA update.

They disagree in two places, and the disagreement is useful:

- An OTA update is the fastest fix the mobile engineer has; the release manager
  says a published version never changes. Both hold: an update is a new
  version with its own runtime version, and it cannot land on a binary it
  does not fit.
- The QA lead's journeys find elements by accessibility label; the specialist
  wants labels written for people, not for tests. The same label serves both
  when it is written for the person first.

## Why four, in sequence

- Kim et al. measured sequential work getting 39% to 70% worse with more
  agents. An app release is sequential — build, audit, gate, release — so the
  members hand over in order.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The device audit and the gate are two verifications by members who did not
  build the screen.

## Where this crew is wrong

- **A Flutter or native Android app.** The shape transfers; the mobile
  engineer does not. Load `flutter-mobile-engineer` or
  `android-mobile-engineer` directly.
- **Backend work.** Nothing here writes a server.
- **Store listing copy.** No member writes marketing text.
- **A change to one screen.** Small, same-file work for the mobile engineer
  alone.

## How to use it

Ask your agent for the crew by name, and do not cut a store build until the
release manager's withdrawal plan exists as a file.
