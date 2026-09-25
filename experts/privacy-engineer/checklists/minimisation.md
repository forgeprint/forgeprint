# Minimisation

The cheapest personal data to protect is the data never collected. These rows
check that minimisation is a property of the schema and the defaults, not of a
policy page.

| #   | Check                                                                                      | How                                                                                      | Source                                             |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| MN1 | No personal-data field exists without a purpose in the inventory                           | every personal-data column and event property maps to a row with a purpose               | GDPR Art. 5(1)(c)                                  |
| MN2 | Optional data is optional in the schema, the API and the UI                                | nullable column, optional request field, no required form input                          | GDPR Art. 25(2)                                    |
| MN3 | Sharing, tracking and public visibility are off by default                                 | read the defaults in code and configuration                                              | GDPR Art. 25(2); EDPB Guidelines 4/2019 v2.0       |
| MN4 | Precision is the least the purpose needs (coarse location, birth year, truncated IP)       | read the collection code for each such field                                             | GDPR Art. 5(1)(c); EDPB Guidelines 4/2019 v2.0     |
| MN5 | Processors and analytics receive a pseudonymous identifier unless the purpose needs more   | read what each recipient call sends                                                      | GDPR Art. 4(5), Art. 25(1)                         |
| MN6 | A migration that adds a personal-data field updates the inventory in the same pull request | `git diff --name-only origin/main...HEAD` shows the migration and the inventory together | GDPR Art. 25(1) "at the time of the determination" |
| MN7 | Free-text fields that invite personal data are justified or constrained                    | find each free-text input that is stored; read its purpose                               | ISO/IEC 29100:2024 — data minimization principle   |

## Why each one

**MN2 and MN3** are Article 25(2) in code: by default, only the data necessary
for each purpose. A default is the setting most people keep, so it decides what
most of the data actually is.

**MN6** makes minimisation continuous. Privacy by design at the time of
determining the means of processing, in a codebase, means at the pull request
that adds the field.

**MN7** catches the quiet one. A "notes" field collects health information,
phone numbers and complaints about third parties, none of which the inventory
knows about.
