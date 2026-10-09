# Accessibility audit

Since iOS 17 the audit the Accessibility Inspector performs by hand can run in
a UI test, and a failing check fails the test with no assertion of its own
([Perform accessibility audits for your app](../references.md)). An app that
does not run it is choosing to find these by hand or not at all.

| #   | Check                                                                                                | How                                                                                         | Source                            |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| AA1 | A UI test calls `performAccessibilityAudit()` on every screen a user can reach                       | `grep -rn "performAccessibilityAudit" UITests` against the screen list                      | Accessibility audits              |
| AA2 | The audit runs in CI, not only on a developer's machine                                              | read the test plan and the CI job                                                           | Accessibility audits              |
| AA3 | Where an audit type is excluded, the exclusion names the audit type and the reason                   | read each call for its `for:` set and its ignore closure                                    | Accessibility audits              |
| AA4 | Every tappable element has a label that reads as a sentence, not an identifier                       | `grep -rn "accessibilityLabel" Sources`; read the labels                                    | Accessibility audits              |
| AA5 | A control that is not a button does not have a button trait, and one that acts like a button does    | read `accessibilityAddTraits` and the audit's `trait` findings                              | `docs/review-standards.md` (WCAG) |
| AA6 | Text scales: no fixed font size where Dynamic Type belongs, and nothing clips at the largest size    | the audit's `dynamicType` and `textClipped` types, plus one manual pass at the largest size | `docs/review-standards.md` (WCAG) |
| AA7 | A finding the audit cannot see — focus order, an announcement after an action — has a test or a note | read the VoiceOver pass notes                                                               | Accessibility audits              |

## Why each one

**AA3 is where this checklist earns its place.** The audit's ignore closure is
the only honest way to deal with a false positive, and it is also the easiest
way to turn a green suite into a decoration. An exclusion that names the audit
type and the element is reviewable; `return true` is not.

**AA5 and AA6 point at the catalog rather than restating WCAG**, which
[`docs/review-standards.md`](../../../docs/review-standards.md) tracks at a
checked version. Two copies of a success criterion is one copy that is wrong.

**AA7 is the limit of the automated audit, stated.** It finds contrast,
unlabelled elements, clipped text, small hit regions and trait errors. It does
not know whether the focus order makes sense or whether anything was announced
after the user acted. Those are a manual pass, and the independent one belongs
to [`accessibility-specialist`](../../accessibility-specialist/SKILL.md).
