# Semantic HTML

Run over the source before review, and over the built HTML where the framework
generates markup. Every hit is fixed or justified in the review; a hit left
unexplained is a finding.

| #   | Check                                                                                                | How                                                  | Source                                 |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| SH1 | Actions are `button`, navigation is `a href`; no click handler on a non-interactive element          | command SH1; read each hit                           | HTML LS; WCAG 2.2 SC 4.1.2, 2.1.1      |
| SH2 | Every form control has a programmatic label, and the visible label is part of the name               | command SH2; for each control find its `label`       | WCAG 2.2 SC 1.3.1, 3.3.2, 2.5.3        |
| SH3 | No positive `tabindex`                                                                               | command SH3 returns nothing                          | WCAG 2.2 SC 2.4.3                      |
| SH4 | No role that repeats or contradicts the element's implicit role                                      | command SH4; read each hit                           | ARIA in HTML                           |
| SH5 | Every element given a widget `role` follows a named pattern, keyboard model included                 | for each hit of SH4, name the APG pattern it follows | APG; WCAG 2.2 SC 2.1.1                 |
| SH6 | Each page has `lang`, a `title`, one `main`, a way to skip repeated blocks, no skipped heading level | read the built HTML of each page template            | WCAG 2.2 SC 3.1.1, 2.4.2, 2.4.1, 1.3.1 |
| SH7 | Every `img` has an `alt` attribute; decorative images have `alt=""`                                  | command SH7 returns nothing                          | WCAG 2.2 SC 1.1.1                      |
| SH8 | Tabular data is a `table` with header cells; layout is not a `table`                                 | read every `table` in the source                     | HTML LS; WCAG 2.2 SC 1.3.1             |
| SH9 | The built HTML has no conformance errors                                                             | command SH9 over the build output                    | Nu Html Checker; HTML LS               |

## Commands

Adjust `src` to wherever the markup lives. These are deliberately coarse: they
find candidates, and reading the hit decides.

```sh
# SH1 — click handlers on elements that are not interactive
grep -rnE '<(div|span|li|td|img)[^>]*on[Cc]lick' src

# SH2 — every form control, to check against its label
grep -rnE '<(input|select|textarea)\b' src

# SH3 — positive tabindex
grep -rnE 'tabindex="?[1-9]' src

# SH4 — explicit roles, redundant ones first
grep -rnE 'role="' src
grep -rnE '<button[^>]*role="button"|<(ul|ol)[^>]*role="list"|<a [^>]*role="link"|<nav[^>]*role="navigation"' src

# SH7 — images with no alt attribute at all
grep -rnE '<img\b' src | grep -v 'alt='

# SH9 — HTML conformance of the built pages (Java 17 or later)
java -jar vnu.jar --errors-only --skip-non-html dist
```

## Why each one

**SH1 is the most common defect in a component.** A `div` with a click handler
has no focus, no keyboard activation and no role, and adding them back one by
one is how a custom button ends up half-working. The native element has all
three by definition.

**SH5** is where ARIA goes wrong. A `role` promises a screen reader a widget
with a known keyboard model; a `role="tab"` that does not answer the arrow keys
is worse than a plain link, because it announces a contract it breaks.

**SH9** needs a note. WCAG 2.2 removed 4.1.1 Parsing, so a conformance error in
the HTML is no longer a WCAG failure by itself. It is still an HTML Standard
failure, and malformed markup is the usual cause of an accessible name that
comes out wrong — which _is_ a WCAG failure, under 4.1.2.
