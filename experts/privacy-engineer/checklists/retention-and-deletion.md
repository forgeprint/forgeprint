# Retention and deletion

Deletion is the privacy control most often claimed and least often tested.
These rows make it code with a test behind it.

| #   | Check                                                                                             | How                                                                                      | Source                                       |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| RD1 | Every retention period is a number and a trigger, not "as long as necessary"                      | read the Retention column                                                                | GDPR Art. 5(1)(e); Art. 30(1)(f)             |
| RD2 | Retention is enforced by a scheduled job in the repository                                        | find the job and its schedule; it covers each store with a retention period              | OWASP ASVS 5.0.0, 14.2.7                     |
| RD3 | Erasure reaches every store and recipient the inventory lists                                     | map each Stores and Recipients cell to a deletion step in the code or runbook            | GDPR Art. 17(1); Art. 19                     |
| RD4 | Processors are asked to delete, by API or documented request                                      | find the call or the request procedure per processor                                     | GDPR Art. 28(3)(g)                           |
| RD5 | Backups are covered by a stated expiry, and restores re-apply deletions                           | read the backup retention setting and the restore runbook                                | GDPR Art. 17(1); EDPB Guidelines 4/2019 v2.0 |
| RD6 | A soft-delete flag is not reported as erasure                                                     | grep for `deleted_at` / `is_deleted`; find the hard-delete or anonymisation that follows | GDPR Art. 17(1)                              |
| RD7 | An end-to-end test creates a user, writes personal data, deletes the user, and asserts it is gone | find the test; it searches each reachable store by identifier after deletion             | OWASP ASVS 5.0.0, 14.2.7; GDPR Art. 25(1)    |
| RD8 | What the test cannot reach is listed, with how deletion there is confirmed                        | read the test's companion note                                                           | GDPR Art. 5(2) accountability                |

## Why each one

**RD3** is where erasure fails in practice: the primary row goes, the search
index, the cache and the analytics tool keep it. Article 19 extends the duty to
recipients; the inventory's Recipients column is the list to work through.

**RD6** because a soft delete is a retention decision wearing the word
"delete". Useful for undo, and not erasure until something removes the data.

**RD7** is the one that makes the rest trustworthy. Without a test, the
deletion path is a belief about the code, and the next feature that writes a
copy somewhere breaks it silently.
