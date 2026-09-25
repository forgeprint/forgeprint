# Compose semantics and tests

TalkBack reads the Compose semantics tree, and Compose UI tests query the same
tree. A composable with the right semantics is both accessible and easy to
test; one without is neither. This is a first pass, not a conformance audit.

| #   | Check                                                                                        | How                                                                                                 | Source                                                               |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ST1 | Every `Icon` and `Image` sets `contentDescription`, to text or to `null` when decorative     | `grep -rnE "(Icon\|Image)\(" src/main` and read each for the argument                               | Android — make apps more accessible; WCAG 2.2 SC 1.1.1               |
| ST2 | A clickable element with no text child has a label and a `Role`                              | `grep -rn "\.clickable" src/main`; each has `onClickLabel`/`role` or a labelled child               | Android — make apps more accessible; WCAG 2.2 SC 4.1.2               |
| ST3 | Custom toggles use `Modifier.toggleable` / `selectable` so their state is announced          | read switches, checkboxes and chips built from `Box`/`Row`                                          | Android — make apps more accessible; WCAG 2.2 SC 4.1.2               |
| ST4 | Touch targets are at least 48 by 48 dp                                                       | read `Modifier.size` on clickable elements smaller than 48.dp                                       | Android — make apps more accessible; WCAG 2.2 SC 2.5.8               |
| ST5 | Text sizes use `sp` and layouts are checked at the largest font scale                        | `grep -rnE "fontSize\s*=\s*[0-9.]+\.dp" src/main` returns nothing; a preview or device pass at 200% | WCAG2Mobile — 1.4.4                                                  |
| ST6 | UI tests enable the Accessibility Test Framework: `enableAccessibilityChecks()`              | `grep -rn "enableAccessibilityChecks" src/androidTest src/test`                                     | Compose — accessibility testing; ui-test-junit4-accessibility 1.12.1 |
| ST7 | UI tests find nodes by text or content description before `testTag`                          | `grep -rc "onNodeWithTag" src/androidTest` against `onNodeWithText\|onNodeWithContentDescription`   | Compose — accessibility testing                                      |
| ST8 | ViewModels are tested with a test dispatcher, and flows with Turbine or `runTest` collection | `grep -rn "StandardTestDispatcher\|UnconfinedTestDispatcher\|\.test {" src/test`                    | Android — coroutines best practices; Turbine 1.2.1                   |
| ST9 | Changed flows were walked with TalkBack, or the report says they were not                    | the report's "not checked" section                                                                  | Compose — accessibility testing                                      |

## Why each one

**ST6** is the reason this checklist is Compose-specific. Since Compose 1.8 the
Accessibility Test Framework runs inside UI tests and fails them on missing
labels, small touch targets, low contrast and traversal-order problems. It
turns ST1–ST4 from a review comment into a red build.

**ST7** because a test that finds a button by `testTag` passes when the button
has no label, and one that finds it by content description fails.

**ST9** because the framework's own guidance is that manual testing with
TalkBack is still essential; props can be right and the reading order wrong.
