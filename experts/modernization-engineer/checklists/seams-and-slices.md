# Seams and slices

Modernisation moves one slice at a time through a seam. These rows check that
each step is small, reversible and releasable.

| #   | Check                                                                                            | How                                                                    | Source                                                                                      |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| SS1 | Each slice names its seam: interface, constructor parameter, module boundary, route or topic     | read the migration plan's slice table                                  | Feathers (2004), ch. 4 — the seam model                                                     |
| SS2 | Across systems, an interception point at the edge diverts one slice to the new system            | find the proxy route or event subscription for the slice               | Fowler, Strangler Fig Application (2024-08-22)                                              |
| SS3 | Inside a codebase, the component is replaced behind an abstraction, releasing at every step      | find the abstraction; every commit on the way builds and passes        | Fowler, Branch By Abstraction (2014-01-07)                                                  |
| SS4 | An interface change is expand, migrate, contract — never a single breaking edit                  | find the expand commit, the caller migrations, and the contract commit | Sato, Parallel Change (2014-05-13)                                                          |
| SS5 | Transitional code is listed with a removal date                                                  | read the plan's transitional-architecture section                      | Cartwright, Horn, Lewis, Patterns of Legacy Displacement (2024) — Transitional Architecture |
| SS6 | One slice per pull request                                                                       | the pull request touches one slice's seam and tests                    | Fowler, Strangler Fig Application (2024-08-22)                                              |
| SS7 | Each slice has a rollback that does not need a deploy of old code: switch the route or flag back | read the slice's rollback line; it names the switch                    | Fowler, Branch By Abstraction (2014-01-07)                                                  |
| SS8 | The slices are ordered by value and risk, with the first one small                               | read the plan's ordering and its reason                                | Cartwright, Horn, Lewis (2024) — Extract Product Lines                                      |

## Why each one

**SS2** is the strangler fig in one line: the new system grows around the old
by taking over at the edge, where traffic can be diverted and diverted back.

**SS5** because transitional architecture is deliberate waste with a purpose.
Without a removal date it stops being transitional and becomes the next layer
somebody has to modernise.

**SS7** is what makes a slice safe to try. If rolling back means redeploying
the old code, the migration has lost its main advantage over a rewrite.
