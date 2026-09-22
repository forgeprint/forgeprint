# 1. No variants or inheritance between blueprints

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer

## Context

A blueprint catalog that grows by community contribution drifts towards two
failure modes. The first is a junk drawer: fifty near-identical folders whose
differences nobody can state. The second is a dependency graph: blueprints that
extend, inherit from, or fork other blueprints, so that resolving one means
walking a chain and merging files whose authors never saw each other's work.

Both failures break the product promise. Forgeprint exists to return exactly one
self-contained package for a given profile. A blueprint that is only meaningful
after merging three parents cannot be returned in one shot, cannot be tested in
one CI job, and cannot be reviewed by one maintainer.

Real variation still exists: the same API blueprint may target Postgres or SQL
Server, JWT or OIDC. That variation is small, enumerable, and belongs to one
author.

## Decision

The manifest schema has no `extends`, `inherits`, `fork_of`, or any equivalent
field, and none will be added. Every blueprint is self-contained.

Variation is expressed through `options`: a flat map of field name to allowed
values, with at most 3 fields and at most 3 values per field. `setup.md` selects
between them with `<!-- if options.<field> == <value> -->` blocks that the MCP
server resolves before returning the file.

One slug per `stack + project_type + requirements` combination. A second
blueprint for the same combination is rejected; a better one replaces the old
one through `supersedes`. Every pull request carries a similarity report, and
overlap above 70% against the closest existing blueprint is a red flag that the
contributor must answer in the pull request template.

## Consequences

- `get_blueprint` and `resolve` read one folder. No merge step, no resolution
  order, no diamond problem.
- A blueprint can be validated, setup-tested, and reviewed in isolation. CI cost
  stays linear in the number of blueprints.
- Some duplication between blueprints is accepted as the price of independence.
  Shared knowledge is factored into skills, not into parent blueprints.
- Contributors who want a fourth option value or a fourth option field must
  argue for a separate blueprint, or improve the existing one and supersede it.
- The option matrix stays small enough to setup-test exhaustively (at most 27
  combinations, in practice far fewer).
