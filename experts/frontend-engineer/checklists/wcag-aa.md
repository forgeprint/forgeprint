# WCAG 2.2 Level AA, first pass

The pass every UI change gets. It is not a conformance audit and does not claim
to be one: a full audit, assistive-technology testing and any legal conformance
statement belong to the `accessibility-specialist` expert.

Level AA means every Level A criterion as well. Cite the success criterion by
number and name, never "WCAG" on its own.

| #   | Check                                                                                                | How                                                                 | Source                               |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| A1  | Zero axe-core violations on every changed page and component state, with the WCAG tags               | run axe-core with the tags below; record version and states scanned | axe-core 4.13; WCAG 2.2              |
| A2  | Every function works from the keyboard, and focus never gets stuck                                   | Tab and Shift+Tab through each changed flow; Enter, Space, Escape   | WCAG 2.2 SC 2.1.1, 2.1.2             |
| A3  | Focus is visible; any removed outline has a `:focus-visible` replacement                             | command A3; for each hit find the replacement                       | WCAG 2.2 SC 2.4.7                    |
| A4  | A focused element is never entirely hidden by sticky or fixed content                                | command A4 to find them; Tab underneath each one                    | WCAG 2.2 SC 2.4.11                   |
| A5  | Text contrast at least 4.5:1 (3:1 for large text); controls, focus rings and meaningful graphics 3:1 | A1 covers text on solid colour; measure the rest by hand, per state | WCAG 2.2 SC 1.4.3, 1.4.11            |
| A6  | Pointer targets at least 24 by 24 CSS pixels, or spaced as the criterion allows                      | measure small controls in the browser's inspector                   | WCAG 2.2 SC 2.5.8                    |
| A7  | Content reflows at 320 CSS pixels wide without two-dimensional scrolling, and zoom is not blocked    | resize to 320; command A7 returns nothing                           | WCAG 2.2 SC 1.4.10, 1.4.4            |
| A8  | Errors are described in text, not by colour alone; async status messages are announced               | read the form error path; find the live region for each status      | WCAG 2.2 SC 3.3.1, 1.4.1, 4.1.3      |
| A9  | Fields that collect the user's own details carry the right `autocomplete` value                      | read every name, email, phone and address field                     | WCAG 2.2 SC 1.3.5; HTML LS, autofill |
| A10 | Anything that moves, blinks or updates on its own for more than five seconds can be paused           | read carousels, tickers and auto-updating regions                   | WCAG 2.2 SC 2.2.2                    |
| A11 | The report has a **not checked** section naming what A1 to A10 did not reach                         | the section exists, even if it is short                             | axe-core README                      |

## Commands

```sh
# A1 — the tags to run axe-core with
#   wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa

# A3 — outlines removed
grep -rnE 'outline:\s*(none|0)\b' src

# A4 — content that can sit on top of a focused element
grep -rnE 'position:\s*(sticky|fixed)' src

# A7 — zoom blocked in the viewport meta tag
grep -rnE 'user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b' src
```

## Why each one

**A2 is the one no tool can do.** A keyboard trap in a custom dialog or a menu
that opens on hover only is invisible to a scanner and total for the person who
meets it. It costs a minute per flow.

**A4 is new in 2.2 and specific to how sites are built now.** A sticky header
that covers the focused link passes every other check, because the focus ring
is drawn — just underneath something.

**A11 is what keeps the pass honest.** axe-core's maintainers put automated
detection at about 57% of WCAG issues. A report that lists only what the tool
found reads as complete and is not; naming the gap is what lets somebody else
decide whether to close it.
