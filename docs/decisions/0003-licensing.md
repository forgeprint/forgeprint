# 3. Split licensing: PolyForm Shield for tooling, CC BY 4.0 for blueprints

- Status: Proposed — drafted per the project kickoff document, pending explicit
  confirmation by the repository owner and a legal review before launch
- Date: 2026-09-22
- Deciders: core maintainer

## Context

Two goals pull in opposite directions.

Blueprints must be maximally free. A user copies `AGENTS.md`, skills, and setup
steps straight into their own project, which may be proprietary. Any copyleft or
non-commercial term on that content makes the product unusable.

The catalog plus tooling must not be trivially re-launched as a competitor. The
value is the curated catalog and the resolver, and an OSI-approved permissive
licence on both invites a rebranded copy.

GitHub's Terms of Service allow any public repository to be viewed and forked on
GitHub, and no licence can prevent that. Forking is also how contribution works,
so forbidding forks is not an option. The licence governs what may be done with
a fork, not whether one may exist.

## Decision

| Part                                  | Licence               | Rationale                                                                                           |
| ------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/**` (MCP server, CLI, site) | PolyForm Shield 1.0.0 | Free to use, modify, and contribute; offering a competing product or service is not permitted       |
| `blueprints/**` (catalog content)     | CC BY 4.0             | Users embed blueprints in their own projects, including commercial ones                             |
| `schema/**`, `skills/**`              | CC BY 4.0             | Same reasoning as blueprints: these are consumed as content                                         |
| Name and logo                         | `TRADEMARK.md`        | "Forgeprint" may be used only for this repository and its official distributions; forks must rename |
| Contributions                         | DCO (`Signed-off-by`) | A CLA suppresses contribution; a sign-off is sufficient                                             |

`LICENSE` at the repository root carries the PolyForm Shield text and states the
split. `blueprints/LICENSE` carries the CC BY 4.0 reference for content.

The README states plainly: Forgeprint is source-available, not OSI open source.
Obscuring that would cost more community trust than the restriction itself.

## Consequences

- Forgeprint cannot be described as "open source" and will not be accepted by
  channels that require an OSI licence. This is understood and accepted.
- Contributors sign off each commit; CI checks for the `Signed-off-by` trailer.
- By contributing, an author licenses blueprint content under CC BY 4.0 and code
  under PolyForm Shield 1.0.0. `CONTRIBUTING.md` says so explicitly.
- Blueprint authors are credited through the `maintainers` field and the site,
  which satisfies CC BY attribution for the catalog itself.
- The trademark, not the licence, is the practical protection against a
  rebranded clone.
- This document is not legal advice. The licence texts are reviewed by a lawyer
  before launch, and this ADR moves to Accepted only after the owner confirms.
