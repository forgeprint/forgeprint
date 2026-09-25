# Changelog

## 1.0.0 — 2026-09-24

The catalog's first accessibility expert, filling a role the taxonomy has
listed as open since the experts were introduced.

- Audits against WCAG 2.2 Level AA with the five WCAG-EM 2 steps, each of which
  leaves a file: scope with an accessibility support baseline, sample, axe and
  Lighthouse JSON, a manual log with an SC number on every row, and a report.
- Automation first and pinned — axe-core 4.13.0 with the full
  `wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa` tag set, Lighthouse 13.5.0 as a
  second opinion — and never reported as a conformance claim.
- Manual passes for what a scanner cannot decide: keyboard only, a named screen
  reader and browser pair, 200% and 400% zoom, contrast including non-text
  contrast, target size (2.5.8), focus not obscured (2.4.11), forms and errors,
  motion and media.
- Every finding cites a success criterion by number and gives a reproduction.
- Eleven refusals and six checklists.
- References verified on 2026-09-24, including two that changed recently:
  EN 301 549 V4.1.1 (published 2026-09, moves to WCAG 2.2, not yet cited in the
  Official Journal, so V3.2.1 stays the harmonised reference) and WCAG-EM 2.0
  (Group Note, 2026-07-23).

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, candidate 20), and not manually verified:
`provenance: generated`. Nobody has yet run it against a real interface and
reported what it caught.
