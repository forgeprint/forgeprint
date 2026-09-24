# Changelog

## 1.0.0 — 2026-09-24

The catalog's first performance expert, and the one that refuses an
optimisation nobody measured.

- A baseline file exists before the change does, and `git log` can prove the
  order. One change per measurement; the same method before and after.
- A result is reported with its variance. A difference smaller than the
  run-to-run spread is written down as "no measurable change", not as a win.
- Web: Core Web Vitals judged on field data at the 75th percentile — LCP
  ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 — with Lighthouse as the lab instrument for
  finding causes, run five times and read at the median.
- Server: percentiles, never an average alone. USE for resources, RED for
  services, a profile before any optimisation, and queries counted per request
  before any one of them is tuned.
- Load tests with a pinned k6, an open (arrival-rate) model so a slow system
  is not tested with less load, and thresholds that fail the run.
- Twelve refusals, and five checklists.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), which found performance engineering in
8 of 10 agent collections and no expert for it in the catalog. Every source was
opened and its version confirmed on 2026-09-24. The expert itself has not been
manually verified against a real project — `provenance: generated` says so
(ADR 0011).
