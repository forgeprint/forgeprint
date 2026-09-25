# Data inventory

The inventory is the file every other privacy check reads. It is found from
the code, one row per field, and it is wrong the moment a migration adds a
column without it.

| #   | Check                                                                                       | How                                                                                               | Source                                    |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| DI1 | A committed inventory has one row per personal-data field                                   | `test -f privacy/data-inventory.md`; compare its rows with the schema's columns                   | GDPR Art. 30(1); OWASP ASVS 5.0.0, 14.1.1 |
| DI2 | Fields were found from the code, not from memory                                            | the review names the schema, API types, analytics events and SDK calls it read                    | OWASP ASVS 5.0.0, 14.1.1                  |
| DI3 | Every row has a purpose                                                                     | no empty Purpose cell                                                                             | GDPR Art. 5(1)(b); Art. 30(1)(b)          |
| DI4 | Special categories and children's data are marked                                           | read the Category column for Art. 9 categories                                                    | GDPR Art. 9(1); Art. 8                    |
| DI5 | Every recipient is listed, processors included (email, error tracking, analytics, LLM APIs) | grep the dependency manifest and outbound calls for third-party SDKs; each appears as a recipient | GDPR Art. 30(1)(d); Art. 28               |
| DI6 | Transfers outside the EEA are flagged for counsel, not decided                              | a recipient's processing location is recorded; the transfer mechanism cell names who decided      | GDPR Chapter V (Art. 44 onwards)          |
| DI7 | The lawful basis column names who decided it and where the decision is recorded             | no basis without a decision reference                                                             | GDPR Art. 6(1); Art. 5(2) accountability  |
| DI8 | Every row has a retention period and a deletion path                                        | no empty Retention or Deletion path cell                                                          | GDPR Art. 5(1)(e); Art. 30(1)(f)          |

## Why each one

**DI2** separates an inventory from a guess. Personal data hides in analytics
event properties, third-party SDK initialisation and free-text fields; a list
written from memory misses exactly those.

**DI5** is where most real exposure is. The database is usually well guarded;
the same email address sent to four SaaS processors is not in anybody's mental
model until the inventory puts it there.

**DI7** keeps the engineer out of a legal decision without leaving the column
blank: the inventory says what basis was chosen, by whom, and where that is
written down.
