# React Native accessibility

React Native maps its accessibility props onto TalkBack and VoiceOver. Nothing
is announced that a prop did not say, and props can be found with a grep. This
is a first pass on changed screens, not a conformance audit.

| #    | Check                                                                                                                               | How                                                                                     | Source                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| RA1  | Every `Pressable` / `Touchable*` has `accessibilityRole` or `role`                                                                  | `grep -rnE "<(Pressable\|Touchable\w+)" app src components` and read each for a role    | RN 0.87 — Accessibility                                           |
| RA2  | An icon-only control has an `accessibilityLabel` (or `aria-label`) saying what it does                                              | read every touchable whose child is an icon or image                                    | RN 0.87 — Accessibility; WCAG 2.2 SC 1.1.1, 4.1.2                 |
| RA3  | Selected, disabled, checked and expanded are announced through `accessibilityState` or `aria-*`                                     | read custom toggles, tabs and accordions                                                | RN 0.87 — Accessibility; WCAG 2.2 SC 4.1.2                        |
| RA4  | No `allowFontScaling={false}` on body text; any cap uses `maxFontSizeMultiplier`                                                    | `grep -rn "allowFontScaling" app src components`                                        | RN 0.87 — Text; WCAG2Mobile — 1.4.4                               |
| RA5  | Changed screens work at the largest system text size without clipped or overlapping text                                            | set the device's largest text size and walk the flow                                    | WCAG2Mobile — 1.4.4; WCAG 2.2 SC 1.4.4                            |
| RA6  | Touch targets are at least 44 by 44 pt (iOS) and 48 by 48 dp (Android), `hitSlop` included                                          | read the style and `hitSlop` of small controls                                          | Apple HIG — Buttons; Android — accessible apps; WCAG 2.2 SC 2.5.8 |
| RA7  | Decorative images are hidden from the screen reader                                                                                 | read images for `accessible={false}` / `aria-hidden` / `importantForAccessibility="no"` | RN 0.87 — Accessibility; WCAG 2.2 SC 1.1.1                        |
| RA8  | A status that appears without focus moving is announced (`accessibilityLiveRegion` or `AccessibilityInfo.announceForAccessibility`) | read toasts, inline errors and loading states                                           | RN 0.87 — Accessibility; WCAG 2.2 SC 4.1.3                        |
| RA9  | The screen does not lock orientation unless the ADR says it is essential                                                            | read `expo.orientation` in `app.json`                                                   | WCAG2Mobile — 1.3.4; WCAG 2.2 SC 1.3.4                            |
| RA10 | Changed flows were walked with TalkBack and VoiceOver, or the report says they were not                                             | the report's "not checked" section                                                      | RN 0.87 — Accessibility (testing)                                 |

## Why each one

**RA1 and RA2** are the pair an agent misses most. A `Pressable` wrapping an
icon is announced as nothing, or as "button" with no name. A user with a screen
reader meets an unlabelled control on every screen that has one.

**RA4** because `allowFontScaling={false}` is the quickest fix for a layout that
breaks at large text, and it fixes it by ignoring the setting the user needs.

**RA10** is what keeps the pass honest: props can be right and the reading order
still wrong, and only a screen reader shows that.
