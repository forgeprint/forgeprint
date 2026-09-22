# 8. A blueprint says where it came from

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Extends: CLAUDE.md §3.1 (manifest schema) and §8 (licensing)

## Context

`blueprint-author` describes what most blueprints are: *"Turn an existing,
working project into a Forgeprint blueprint."* The recipe is derived from a
project that already works, because that is the only way to know it works.

The catalog then hands the result to strangers under CC BY 4.0, and
`blueprints/LICENSE` asks them to credit "the blueprint and the catalog". Until
now the manifest recorded who maintains a blueprint and nothing about where its
content came from. Three consequences, in ascending order of seriousness:

1. **The credit stops with us.** A reader crediting Forgeprint credits the
   wrong party when the design was somebody else's.
2. **A licence question has no answer.** If a recipe was derived from a
   GPL-licensed project, shipping it as CC BY 4.0 is a problem — and nobody
   can tell, because nothing says where it came from.
3. **A reviewer cannot check the one thing that matters most.** "Is this
   original?" is unanswerable when the answer lives only in the author's
   memory.

The catalog's whole argument is that it is curated rather than collected.
Curation without attribution is a weaker claim than it sounds.

## Decision

An optional `provenance` object in `manifest.yaml`:

```yaml
provenance:
  derived_from: https://github.com/example/starter
  license: MIT
  verified_on: 2026-09-22
  note: 'The auth wiring and the test layout; the rest is ours.'
```

- **`derived_from`** — an `https` URL. A credit somebody can follow; "an old
  project of mine" credits nobody and is refused.
- **`license`** — the licence that project is under, SPDX where there is one.
  This is the field that decides whether the derivation was allowed at all,
  so a provenance record without it is refused.
- **`verified_on`** — a calendar date. Sources move; this says when somebody
  last looked.
- **`note`** — optional, at most 300 characters: which parts were derived, so
  the record is honest about its scope.

**Optional, because a blueprint written from scratch has no provenance**, and
inventing one would be worse than leaving it out. `catalog-research` requires
a candidate to state its intended source before anybody writes code, which is
where the question is cheap to answer.

## Consequences

- `forgeprint validate` enforces the shape; it cannot enforce the truth. A
  reviewer still has to read the source, and `blueprint-review` asks whether
  `AGENTS.md` was copied — the two answer different halves of the same
  question.
- The three official blueprints carry no `provenance`: they were written from
  the .NET documentation and from the maintainer's own projects, not derived
  from a specific repository. Leaving the field absent is the accurate record,
  not an oversight.
- A candidate whose source licence does not permit derivation is not a
  candidate. That is now a question asked during research rather than during
  review, which is several days earlier.
- The site does not show provenance yet. When it does, it belongs next to the
  maintainer byline: both answer "who is behind this".
