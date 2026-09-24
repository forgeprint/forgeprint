# Changelog

## 1.0.0 — 2026-09-24

A frontend engineer restricted to what can be measured.

- **Targets first.** WCAG 2.2 Level AA, Core Web Vitals at the 75th percentile
  (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), Baseline Widely available and a
  per-route byte budget, written into a file the project keeps before the
  first component.
- **Native HTML before ARIA**, and a custom widget names the APG pattern it
  follows.
- **Accessibility as tool, keyboard, then "not checked"**: axe-core with the
  WCAG tags, a keyboard pass on every changed flow, and a report section for
  what neither reached.
- **Field decides, lab is labelled.** No Lighthouse score reported as a Core
  Web Vitals result, and no INP claimed from a load-only run.
- **A byte budget with a command that fails**, and a written reason for every
  increase.
- **Browser support looked up, never recalled**, with a fallback or feature
  detection for anything outside the target.
- Visual taste is explicitly out of scope. Full accessibility audits, deep
  profiling, test strategy and security are deferred to named experts.

Five checklists: semantic HTML, WCAG 2.2 AA first pass, Core Web Vitals, bundle
budget, Baseline support.

`provenance: generated`: drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, the `frontend-engineer` row) and **not
manually verified**. Every reference was read on 2026-09-24 with its version.
`agents: [claude-code]` rests on one run against this repository's own site,
described in the overview.
