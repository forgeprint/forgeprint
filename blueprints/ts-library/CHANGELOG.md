# Changelog — ts-library

## 1.1.0 — 2026-09-24

Step 14 reads the JSON it was already producing, from the architecture review
([2026-09-23](../../docs/reviews/ts-library/2026-09-23.md), finding 2).

The step asserts that no source file is in the tarball, and it did that by
counting `grep` matches. An assertion about an absence cannot tell "no sources
shipped" from "no such field" — and the second is exactly what a change to
`npm pack --json` would look like. The check would keep passing and would have
stopped checking anything.

- **It parses `packed.json` and filters the `files` array**, so a missing or
  renamed field throws rather than reading as success.
- **Step 13 is unchanged.** It asserts a presence, so it fails loudly on its
  own if the shape moves; the review said so and it is right.

No change to the library. One step rewritten, no step added.

## 1.0.0 — 2026-09-23

First version, and the catalog's first `lib` blueprint.

A publishable TypeScript library: an exports map, type declarations, tests that
run against the built output, and a release workflow that publishes from a tag
with npm provenance and no stored token.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where `lib`
was one of two empty project types and the observation was that a library
blueprint's value is not the source layout but publishing correctly. It is also
the first blueprint here to carry `cd`.

The example is a slugifier and it is not arbitrary. The usual implementation
normalises with `NFKD` and strips combining marks, which looks universal and is
not: Turkish dotless `ı` has no decomposition, so it survives normalisation,
fails the ASCII filter and becomes a separator — `Çınar` turns into `c-nar`,
and German `ß` disappears. That happened while building this, with those exact
inputs. The letters are now mapped explicitly and three tests cover them, so
that "simplifying" the function back to normalise-and-strip fails.

The recipe proves what ships rather than assuming it: `npm pack --dry-run`
asserts the type declarations are in the tarball and that no source or test
file is.

Its recipe runs in CI like every other and nobody has published a package from
it, so it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).
