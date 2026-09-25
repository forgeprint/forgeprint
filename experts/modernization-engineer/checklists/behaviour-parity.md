# Behaviour parity

Not "feature parity". Each behaviour of a slice is decided — keep, change or
drop — with evidence, and old and new are compared before the switch.

| #   | Check                                                                                          | How                                                         | Source                                                         |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| BP1 | The slice's behaviours are listed from the code: characterization tests, routes, reports, jobs | read the list; each item points at where it was found       | Feathers (2004), ch. 13                                        |
| BP2 | Each behaviour is marked keep, change or drop                                                  | no unmarked row                                             | Cartwright, Horn, Lewis (2024) — Feature Parity                |
| BP3 | Each decision carries evidence (usage from logs or metrics) and an owner who agreed            | read the evidence and owner columns                         | Cartwright, Horn, Lewis (2024) — Feature Parity                |
| BP4 | "Feature parity" is not the acceptance criterion of the migration                              | grep the plan for "feature parity" used as a goal           | Cartwright, Horn, Lewis (2024) — Feature Parity                |
| BP5 | Where the slice allows it, old and new run on the same inputs and the outputs are diffed       | find the comparison harness and its last report             | Cartwright, Horn, Lewis (2024) — Legacy Mimic, Divert the Flow |
| BP6 | Every difference in the comparison is explained or fixed before the switch                     | read the report; no unexplained difference                  | Fowler, Strangler Fig Application (2024-08-22)                 |
| BP7 | The factors of the twelve-factor app the slice moves towards are named                         | the plan names them, e.g. III Config, VI Processes, XI Logs | The Twelve-Factor App (site last updated 2017)                 |

## Why each one

**BP4** is the row that protects the incremental plan. The Patterns of Legacy
Displacement name the wish for feature parity as a recurring factor in failed
replacements: it means reproducing everything, including what nobody uses, and
it leads back to one big cut-over.

**BP3** makes "drop" a safe answer. Usage data and an owner's agreement are
what distinguish a behaviour that is no longer needed from one somebody forgot.

**BP5** is the strongest evidence a migration can have: the same input, both
systems, and a diff. It is not always possible; where it is, it replaces a lot
of argument.
