# UI Build Crew

_Assembled by @aliosmanmho_

Three experts for turning a design into web UI that can be measured rather
than admired: built to WCAG 2.2 AA, Core Web Vitals and a byte budget, audited
by hand where a scanner stops, and gated on the journeys that matter. There is
no designer in it on purpose — design taste has no checkable standard, so the
design comes in from Figma and what is checkable about it is checked
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D4 and D5).

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                               | The question it asks first                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`frontend-engineer`](../../experts/frontend-engineer/SKILL.md)               | Semantic HTML, a declared Baseline, Core Web Vitals and a bundle budget      | Which element is this, before which component                                   |
| [`accessibility-specialist`](../../experts/accessibility-specialist/SKILL.md) | The automated baseline, then keyboard, screen reader, zoom and forms by hand | Can this be done with a keyboard alone, and does a screen reader say what it is |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)             | End-to-end journeys that are deterministic, and a gate whose red means stop  | Would the suite notice if this button stopped working                           |

**Two checkers, for two different questions.** The accessibility specialist
audits what the frontend engineer built and names a success criterion and a
reproduction for every finding. The QA lead owns the gate: the journeys, what
the pipeline runs, and what a red build means. The frontend engineer is the one
member that builds, and it does not mark its own work done.

## What they install

| Integration                                                               | Why this crew wants it                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`figma-mcp`](../../integrations/figma-mcp/README.md)                     | The design as data — sizes, colours, text — instead of a screenshot described in words     |
| [`playwright-mcp`](../../integrations/playwright-mcp/README.md)           | The end-to-end journeys, and keyboard-only passes, against a running page                  |
| [`chrome-devtools-mcp`](../../integrations/chrome-devtools-mcp/README.md) | Performance traces and the network log, for the Core Web Vitals the frontend engineer owns |

All three are third-party software. The Figma token reads every file it can
reach; Playwright and DevTools drive a real browser with no human between the
agent and the page. Point them at a development build, not at a session logged
in to anything.

## The order they are useful in

1. **Frontend engineer first**, from the Figma file: semantic HTML before
   styling, the Baseline declared, the byte budget set before the first
   dependency.
2. **Accessibility specialist second**, once a page renders: the automated
   baseline, then the manual passes the scanner cannot make.
3. **QA lead third**, writing the journeys against the accessible names the
   specialist confirmed — a test that finds a button by its role and name also
   proves the name exists.

They disagree in two places, and the disagreement is useful:

- The design file is the input, not the authority on contrast or target size.
  When a colour or a hit area in it fails a success criterion, the specialist
  names the criterion and it goes back to whoever owns the design — not quietly
  changed in code, and not quietly shipped.
- The frontend engineer's automated accessibility checks pass long before the
  specialist is satisfied. Both are right: automation is the floor, and the
  manual passes are where most real failures are found.

## Why three

- The Claude Code agent-teams documentation says three focused teammates often
  outperform five scattered ones, and to avoid teams for same-file edits.
- MAST (Cemri et al.) found sharper role specifications worth +9.4% and a
  verification step worth +15.6%. One builder and two checkers with different
  questions is both.
- Kim et al. measured errors amplified 17.2 times across independent agents.
  Building UI is coupled work, so there is one builder, not several.

## Where this crew is wrong

- **Backend or API work.** Nothing here reads a server.
- **Brand identity or visual taste.** No member can check it, and none
  pretends to.
- **A tweak to one component in one file.** Small, same-file work goes faster
  with the frontend engineer alone.

## How to use it

Ask your agent for the crew by name, give it the Figma frame, and run the
members in the order above. Treat any finding with a success criterion as a
bug, not a suggestion.
