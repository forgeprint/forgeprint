# Modernization Engineer

## What it changes

Asked to modernise something, an agent rewrites it: a new module, new tests
that describe the new module, and a pull request that replaces the old one in
one go. Nobody can say what behaviour changed. This expert makes five
differences:

- **Current behaviour is pinned first.** Characterization tests record what the
  old code does — surprises included — and are committed before the change, so
  the commit order proves it.
- **Change moves through a seam, one slice at a time.** Branch by abstraction
  inside a codebase, the strangler fig across systems, expand–migrate–contract
  for interfaces. Every slice has a rollback that is a switch, not a redeploy.
- **Upgrades go one major version per step**, following the vendor's guide for
  that pair, with deprecations cleared first and the runtime and the framework
  never in the same pull request.
- **No "feature parity".** Each behaviour is marked keep, change or drop, with
  usage evidence and an owner; old and new are compared on the same inputs
  where possible.
- **Decommissioning is evidence-based and deletes things**: zero measured
  traffic over a stated window, readers of the old data gone, credentials
  revoked, and the transitional code removed too.

Five checklists — characterization tests, seams and slices, stepwise upgrades,
behaviour parity, decommission — and eight refusals.

## What it fits

- Changing untested legacy code without breaking it.
- Migrating a system to a new one incrementally, with the old one serving
  traffic until it is not needed.
- Framework and runtime upgrades across several major versions.
- Removing a legacy component once and for all, including what it left behind.
- Any stack. The method is Feathers' and Fowler's, and the commands are git,
  coverage and the vendor's own tools.

## What it does not fit

- **Choosing the target architecture.** Where the system should end up —
  service boundaries, layering, data ownership — is an architect's decision.
  In this catalog that is [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md)
  for .NET, with language-specific architects for other stacks planned. This
  expert takes the system there safely.
- **Performance work.** A migration that claims to be faster brings numbers from
  [`performance-engineer`](../performance-engineer/SKILL.md).
- **Greenfield projects.** Nothing to characterise, nothing to strangle; a
  blueprint is the better start.
- **Moving data at scale** — reconciliation, backfills, dual writes at the
  database level: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Code with no runnable entry point at all**, where no test can be written
  against the current behaviour. The method needs somewhere to observe; without
  one, the first job is making one, and this expert says so rather than
  guessing.

## Pros and cons

**In its favour:** the rules leave evidence — the test commit precedes the
change commit, each upgrade step is its own pull request, each dropped
behaviour has usage data and an owner. Its most useful refusal is the least
popular: no feature parity. It is the requirement that quietly turns an
incremental migration back into a big-bang cut-over.

**Against it:** it is slow on purpose. Characterization tests for code nobody
understands take longer than the change, and a strangler fig carries
transitional code — proxies, flags, abstractions — for months. On a small,
well-tested codebase, a direct refactoring is cheaper and this expert is
overhead. And it has not been run on a real project by a person;
`provenance: generated` is the honest label.
