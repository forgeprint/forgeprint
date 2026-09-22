# Assumptions

Working assumptions made while building Forgeprint, recorded per CLAUDE.md §10.4.
Each entry states what was assumed, why the question came up, and what happens if
the assumption turns out to be wrong. Entries are removed once the repository
owner confirms or overrides them.

| # | Date | Assumption | Why | If wrong |
|---|---|---|---|---|
| 1 | 2026-09-22 | The licensing split in CLAUDE.md §8 (PolyForm Shield 1.0.0 for `packages/**`, CC BY 4.0 for `blueprints/**`, DCO, `TRADEMARK.md`) is written as drafted. ADR 0003 carries status `Proposed` until the owner confirms. | Phase 0 requires the licence files to exist, but §8 marks the decision as a draft. | The licence files and ADR 0003 are rewritten. Nothing else depends on the choice, so the change is local. |
| 2 | 2026-09-22 | ADRs 0001, 0002 and 0004 are `Accepted`, because §4, §5 and §9 state them as binding rules rather than proposals. | An ADR needs a status. | The affected ADR is revised; these three shape the schema and the CLI, so a change here is not local. |
