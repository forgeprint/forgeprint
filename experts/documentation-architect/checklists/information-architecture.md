# Information architecture

The map of the set: which sections exist, what each page answers, and whether a
reader can reach it. Run it on the inventory before proposing a new tree.

| #   | Check                                                                                       | How                                                                                        | Source                                                    |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| IA1 | An inventory lists every documentation file with its type and the one question it answers   | compare the inventory with `git ls-files '*.md' '*.rst' '*.adoc'`; a missing file is a gap | ISO/IEC/IEEE 26514:2022 (information for users, planning) |
| IA2 | Each page's type was decided with the compass's two questions                               | the inventory has a type column; no row says "mixed"                                       | Diátaxis — the compass                                    |
| IA3 | Top-level sections follow one axis: the four types, or audiences with the four types inside | read the navigation's first level                                                          | Diátaxis — the map                                        |
| IA4 | Every section has a landing page that says what is in it and for whom                       | open each section's index page                                                             | ISO/IEC/IEEE 26514:2022                                   |
| IA5 | No page is missing from navigation unless its exclusion is written down                     | MkDocs 1.6: `validation.nav.omitted_files: warn`, then `mkdocs build --strict`             | MkDocs 1.6.1 — configuration, `validation`                |
| IA6 | One canonical page per topic; other pages link to it                                        | grep headings across the set; a heading on two pages is a finding                          | Write the Docs — documentation guide                      |
| IA7 | Reference with a machine-readable source (API description, CLI help, schema) is generated   | find the generator step in the build                                                       | Diátaxis — reference                                      |
| IA8 | The restructuring is a sequence of small published changes, not one tree move               | count files moved per pull request in the plan                                             | Diátaxis — how to use Diátaxis                            |

## Why each one

**IA1 comes before everything.** A new structure proposed without an inventory
reorganises the pages somebody remembered and orphans the rest.

**IA5 is the one a machine can hold.** MkDocs only reports an omitted page at
`info` by default, which `--strict` ignores. One configuration line turns an
orphan into a failed build.

**IA8** is Diátaxis's own advice, and it is the difference between a structure
that arrives and one that is abandoned halfway with every inbound link broken.
