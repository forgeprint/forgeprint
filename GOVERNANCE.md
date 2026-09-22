# Governance

How decisions get made in Forgeprint, who makes them, and what happens when
nobody answers.

The short version: **blueprint maintainers approve, the core maintainer
merges.** Everything below follows from that split.

---

## Roles

### Core maintainer

The repository owner. Holds merge rights on `main` and is the only person who
merges anything. Owns the repository root in `.github/CODEOWNERS`, which means
every pull request needs their review by construction.

The core maintainer is responsible for the catalog as a whole: whether a
blueprint belongs in it, whether two blueprints are really the same one, and
whether the taxonomy should grow.

### Blueprint maintainer

Listed in the `maintainers` field of a blueprint's `manifest.yaml`, which is
written into `.github/CODEOWNERS` by `forgeprint build-codeowners`.

A blueprint maintainer:

- reviews and approves changes to their blueprint,
- keeps its setup recipe working and its `CHANGELOG.md` honest,
- answers issues about it.

A blueprint maintainer does **not** merge, and has no authority over other
blueprints.

### Contributor

Anyone who opens a pull request. No status required, no agreement to sign
beyond the [DCO](DCO) sign-off on each commit.

---

## How a change gets merged

1. **Deterministic checks.** `forgeprint validate`, the similarity report and
   the setup lint run first. A red result is not a review question; it is a
   fix. These commands run locally as well as in CI, so the result is the same
   either way (see [ADR 0002](docs/decisions/0002-actions-optional.md)).
2. **Blueprint maintainer review.** The Code Owners rule requests it
   automatically for changes inside a blueprint folder.
3. **Judgment review.** The rules in [CONTRIBUTING.md](CONTRIBUTING.md) are
   applied and exactly one verdict is issued:

   | Verdict           | Meaning                                                               |
   | ----------------- | --------------------------------------------------------------------- |
   | `MERGE`           | Checks pass, nothing blocks it; waiting for the core maintainer       |
   | `DUPLICATE`       | Belongs in an existing blueprint; the contributor is redirected there |
   | `CHANGES`         | A concrete list of things to fix                                      |
   | `WAIT_MAINTAINER` | Waiting for the blueprint maintainer to respond                       |

   The review posts a comment and a label. It never approves, never merges and
   never pushes to the contributor's branch.

4. **Merge.** The core maintainer approves, and GitHub merges.

When a review is unsure, it issues `CHANGES` rather than `MERGE`. A wrong merge
costs the catalog more than a wrong rejection costs a contributor.

---

## Duplicates

A duplicate is never closed silently. The response names the closest existing
blueprint and offers the contributor a route:

- add what is missing as an **option** on that blueprint,
- send a fix to it, or
- replace it, by setting `supersedes` and deprecating the old one.

Rejecting a duplicate without a route is a governance failure, not a tidy
catalog.

---

## Becoming a blueprint maintainer

- **By writing one.** The author of a merged blueprint is its first
  maintainer.
- **By contributing to one.** After three meaningful merged pull requests on
  the same blueprint, the contributor is offered co-maintainership. Meaningful
  means a fix, an option, or a setup correction — not a typo. This is offered
  manually today and by bot later.
- **By adopting one.** Any contributor may claim an `orphaned` blueprint.
  First to claim it, with a pull request that brings it back into shape, gets
  it.

Maintainership is per blueprint. Nobody accumulates authority over the catalog
by holding many of them.

---

## When nobody answers

- **14 days.** If a blueprint maintainer does not respond to a pull request
  within 14 days, it falls to the core maintainer, who may review and merge it
  without that approval.
- **90 days.** A blueprint with no maintainer response for 90 days is labelled
  `orphaned` and marked as such on the site. It stays in the catalog and the
  resolver keeps returning it; the label is a call for adoption, not a
  deprecation.
- **Deprecation** is separate and deliberate: it is set in the manifest
  (`deprecated: true`), normally together with the `supersedes` field on the
  blueprint that replaces it.

---

## Tiers

`tier` in the manifest states how much the project vouches for a blueprint.

| Tier        | Meaning                                                                                                              | Who grants it                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `community` | Contributed and validated, setup not personally run by a maintainer. The MCP server returns it with a note saying so | Default for every contribution |
| `verified`  | A maintainer ran the setup on a clean machine and confirmed it works                                                 | Core maintainer                |
| `official`  | Maintained by the core maintainer                                                                                    | Core maintainer                |

A tier is never raised by the blueprint's own author. `verified` requires
somebody other than the author to have run the recipe.

---

## Taxonomy and schema changes

`schema/taxonomy.yaml` is a shared vocabulary; a term added carelessly is a
term every future contributor has to reason about. Therefore:

- A taxonomy change is its own pull request, never bundled with the blueprint
  that needs the term.
- A new term is justified by a blueprint that cannot be described without it.
- Renaming or removing a term is a breaking change to the schema and requires a
  schema version bump.

The manifest schema itself is versioned by its `schema` field. Adding an
optional field is a minor change; changing the meaning of an existing field, or
requiring a new one, is a new schema version.

Two schema changes will not be accepted, ever: an inheritance mechanism between
blueprints, and free-text tag fields. See
[ADR 0001](docs/decisions/0001-no-variants.md).

---

## Design rules that outrank convenience

These are settled and are not re-argued per pull request. Changing one means
writing an ADR that supersedes the existing one.

- **No variants or inheritance** — [ADR 0001](docs/decisions/0001-no-variants.md)
- **Everything runs locally; hosted CI is optional** — [ADR 0002](docs/decisions/0002-actions-optional.md)
- **Split licensing, source-available** — [ADR 0003](docs/decisions/0003-licensing.md)
- **English-only catalog** — [ADR 0004](docs/decisions/0004-english-only-catalog.md)

---

## Changing this document

Governance changes are pull requests against this file, decided by the core
maintainer. Changes that affect maintainers are announced in an issue before
they are merged.

---

## Conduct

Be straightforward and assume the other person is acting in good faith.
Criticise the blueprint, not the contributor. Harassment, personal attacks and
deliberate disruption get the participant removed from the project.

Report a problem privately to the core maintainer. Security problems go through
GitHub's private vulnerability reporting instead.
