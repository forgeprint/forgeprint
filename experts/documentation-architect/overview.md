# Documentation Architect

## What it changes

An agent asked to "organise the docs" moves files into new folders in one
large change, breaks every inbound link, and leaves the next behaviour change
to drift from its page exactly as before. This expert works on the structure
and the workflow instead:

- **An inventory first.** Every documentation file, its Diátaxis type and the
  one question it answers, with an action per row. The new tree comes out of
  it in small published steps, as Diátaxis itself advises.
- **No orphan pages, enforced.** The docs build is configured so a page missing
  from navigation fails strict mode, instead of being reported at a level
  nobody reads.
- **Docs change in the pull request that changes behaviour**, with
  `CODEOWNERS` requesting a docs reviewer automatically.
- **One named style guide, enforced by a pinned linter.** Google's or
  Microsoft's, recorded in an ADR, with project exceptions in one vocabulary.
- **A link check that blocks on what is yours and reports on what is not**:
  internal links and anchors on every pull request, external links on a
  schedule.
- **A written version policy**: the default is the latest stable release, old
  versions are hidden and bannered, never deleted.

Five checklists, eleven refusals, every row citing a source checked on
2026-09-25.

## What it fits

- A `docs/` folder that grew without a map, where readers find pages by search
  or not at all.
- Starting documentation for a new project, before the first twenty pages set
  the shape by accident.
- Choosing docs tooling, and writing the ADR that pins it.
- A project where docs and code disagree and nobody can say when they diverged.
- Any stack. The worked examples use MkDocs, lychee and Vale; the checklist
  rows ask for the property, not the tool.

## What it does not fit

- **Writing or editing pages.** That is
  [`technical-writer`](../technical-writer/SKILL.md): the type of one document,
  its samples, its deletions. This expert decides where the page goes and what
  checks it; the writer decides what it says. Together with an API designer
  they form the planned `docs-crew` (expansion plan D19).
- **The API contract behind generated reference.** The `api-designer` role owns
  it; it is an open pull request and not yet on main.
- **Release notes content and version numbering.** The `release-manager` role.
- **Accessibility of the docs site.** The `accessibility-specialist` role and
  WCAG 2.2.
- **Developer relations, marketing pages, positioning.** Refused in this
  catalog as marketing rather than documentation (D19).
- **Documentation outside a repository** — a wiki, a knowledge base, a help
  centre with no pull requests. Most of the checklists assume docs as code.

## Pros and cons

**In its favour:** almost every row is a file, a grep or a CI job, so a review
takes minutes and settles arguments. The two configuration lines that make
MkDocs fail on orphans and missing anchors, and the split link check, are the
kind of detail an agent does not propose unasked.

**Against it:** it assumes GitHub for file locations and code owners; other
forges have equivalents it does not name. The Diátaxis site publishes no
version, so its rows are dated rather than versioned. And it is
`provenance: generated` — drafted from research, not from running a docs
migration — so the first real use is the evidence it most needs.
