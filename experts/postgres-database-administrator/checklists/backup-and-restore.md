# Backup and restore

The question is never "do we have backups". It is "when did we last restore
one, how long did it take, and where is the record".

| #    | Check                                                                                          | How                                                                                           | Source                          |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| BR1  | Recovery point and recovery time objectives are written down, with the person who agreed them  | the runbook states both as numbers                                                            | ASVS 5.0 V14.1.2                |
| BR2  | The method matches the objectives: WAL archiving plus base backups wherever RPO is under a day | read the archiving configuration and the base backup schedule                                 | PG18 §25.3, §25.3.1, §25.3.2    |
| BR3  | WAL archiving is succeeding, not merely configured                                             | `pg_stat_archiver`: `failed_count` not rising, `last_archived_time` recent                    | PG18 §27.2.12                   |
| BR4  | Every base backup passes `pg_verifybackup`                                                     | the command's exit status is recorded; for tar format, with `--no-parse-wal`                  | PG18 `pg_verifybackup`          |
| BR5  | A restore is tested on a schedule, into a scratch instance, to a stated `recovery_target_time` | `db/restore-tests/<YYYY-MM-DD>.md` exists and is newer than the schedule allows               | PG18 §25.3.5; `pg_verifybackup` |
| BR6  | The restored database is checked, not just started                                             | the record contains row counts against the source, `bt_index_check` output, and one app query | PG18 §F.1                       |
| BR7  | The measured restore duration is within the recovery time objective                            | compare the duration in the record with BR1                                                   | ASVS 5.0 V14.1.2                |
| BR8  | Backups live off the database host, encrypted, with access limited to the backup role          | read where the archive and base backups are written, and who can read them                    | ASVS 5.0 V14.2.4                |
| BR9  | Backups are deleted on a retention schedule, and the schedule is written down                  | the retention policy exists and the oldest backup matches it                                  | ASVS 5.0 V14.2.7                |
| BR10 | A restored copy is governed like production: same access controls, destroyed after the test    | the record says when the scratch instance was destroyed                                       | ASVS 5.0 V14.2.4                |

## Why each one

**BR5** is the checklist. Everything else supports it. The PostgreSQL
documentation says outright that verifying a backup is no substitute for
restoring it and checking that the result contains the right data. A backup
that has never been restored is a hope with a storage bill.

**BR7** is the number nobody measures until it matters. A restore that works
but takes nine hours, against an objective of one, is a failed recovery plan
that happens to produce a database.

**BR10** is the one people forget because a restore test feels like an
internal exercise. It is a complete copy of production data, and a breach of it
counts the same.
