# Frontend Engineer

## What it changes

An agent asked to build or review a web UI will produce something that looks
right, call it accessible because it added some `aria-` attributes, call it
fast because a Lighthouse run on the machine it was working on came back green,
and use whichever CSS feature it remembers as supported. None of those claims
has been checked. Four things change with this expert:

- **The targets are written down before the first component** — WCAG 2.2 Level
  AA, Core Web Vitals at the 75th percentile (LCP ≤ 2.5 s, INP ≤ 200 ms,
  CLS ≤ 0.1), a Baseline level, a byte budget — so the work is checked against
  a file rather than against memory.
- **Native HTML first, and ARIA only with a named pattern.** A `role` on a
  custom widget has to point at the ARIA Authoring Practices pattern it
  follows, keyboard model included.
- **Lab is labelled lab.** Core Web Vitals pass or fail on field data at p75; a
  Lighthouse number is a cause-finder, and INP is never claimed from a run that
  observed no interaction.
- **Every report has a "not checked" section.** Automated accessibility tools
  find about 57% of WCAG issues by their own maintainers' account, so the
  report says what it did not look at.

Five checklists — semantic HTML, WCAG 2.2 AA first pass, Core Web Vitals, the
bundle budget, Baseline support — each row a grep, a command or a reading, and
each citing a source with a version.

## What it fits

- Building or reviewing pages and components in any web stack. It is
  deliberately stack-neutral: no framework, no language, only what the browser
  receives.
- A pull request that adds JavaScript, a dependency or a new CSS or DOM feature,
  where the question is what it costs in bytes and who it leaves out.
- Setting up the checks a project will keep: axe-core assertions per component
  state, a budget command that fails the build, a targets file.
- A first accessibility pass before somebody qualified does a full audit.

## What it does not fit

- **Visual design and taste.** Colour choices, typography, spacing, whether a
  layout is attractive or on-brand. There is no standard to check these
  against, so this expert does not have an opinion about them and refuses to
  present one as a finding. The checkable edges — contrast, target size,
  reflow, text spacing — are under WCAG and are in scope.
- **A WCAG conformance claim, an EN 301 549 statement, or assistive-technology
  testing.** It runs a first pass and says so. A full audit belongs to an
  `accessibility-specialist` expert, planned and not yet written.
- **Deep performance work.** Trace analysis, memory leaks, server response
  time, CDN and network tuning, building a field-data pipeline: a
  `performance-engineer` expert, also planned.
- **Test strategy.** Which layer a test belongs in, end-to-end suites, flaky
  tests and the release gate belong to
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md). This expert supplies
  the checks; that one decides where they gate.
- **Security.** Cross-site scripting sinks, Content Security Policy, auth flows
  in the browser and third-party scripts as a trust boundary belong to
  [`security-reviewer`](../security-reviewer/SKILL.md).
- **Native mobile and desktop UI.** Web only.

## Pros and cons

**In its favour:** every rule is a number from a published source, a success
criterion by number, or a command with an exit code, and the sources are
versioned and dated. It asks for nothing to be installed by the expert itself;
the tools it names are ones a project chooses to add.

**Against it:** restricting itself to what can be measured means it is silent
on a large part of what people mean by "good frontend work", and a reader
looking for design judgement will find none. The checks cost time on every
change, and the "not checked" section is uncomfortable to write because it is
always longer than the author would like. It is also `provenance: generated`:
drafted by a tool from the 2026-09-24 research, not written from someone's
practice.

**What `agents: [claude-code]` rests on, exactly.** Claude Code applied it once,
to this repository's own generated site under `docs/`, running the greps in
`semantic-html.md`, `wcag-aa.md`, `core-web-vitals.md` and
`baseline-support.md` and the compressed-size command in `bundle-budget.md`.
Most rows came back clean: no click handlers on non-interactive elements, no
positive `tabindex`, no removed outlines, no zoom blocking, no images without
`alt`. Two things came out that an unguided pass would likely not have raised:

- **SH5:** the catalog page's tabs carry `role="tab"` but not the APG Tabs
  keyboard model — no arrow-key movement, no roving `tabindex`, no
  `aria-controls`, and the panels carry no `role="tabpanel"`. The landing
  page's tabs, built separately, do follow the pattern. Each catalog tab is
  still a native `button`, so the page stays keyboard-operable; the finding is
  that it announces a widget contract it does not keep.
- **BB1:** the site ships about 1.4 KB of compressed JavaScript and 2.3 KB of
  compressed CSS and has no budget recording that — so nothing would notice if
  it grew tenfold.

That is one run, on a small static site, with no axe-core scan, no keyboard
pass and no field data. It shows the greps find something; it does not show
the whole procedure works on an application. If it changes nothing about what
your agent does, say so in an issue — that is the evidence it most needs.
