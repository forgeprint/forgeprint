# Rollout and rollback

"We can roll back" is believed by every team and true for fewer than half. This
checklist is about which half you are in, established before you need to know.

| #   | Check                                                                                                      | How                                            | Source                                     |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| RR1 | The release plan states the rollback: which command, how long, and what it does not undo                   | read the plan                                  | —                                          |
| RR2 | What the rollback does **not** undo is enumerated: migrations, consumed messages, sent mail, charged cards | read the plan; an empty list is the finding    | —                                          |
| RR3 | The rollback has been performed by somebody following the written steps, in a non-production environment   | ask when and by whom                           | A procedure nobody has executed is a draft |
| RR4 | Deploy and release are separate: code ships dark, behaviour is switched on                                 | is there a flag                                | Continuous delivery                        |
| RR5 | The rollout is gradual, with a stated abort signal                                                         | read the strategy and the metric that stops it | Progressive delivery                       |
| RR6 | A schema change is expand/migrate/contract, so the previous version still runs                             | read the migration alongside the deploy        | ParallelChange                             |
| RR7 | The previous artifact is still available to deploy                                                         | check the registry retention                   | —                                          |
| RR8 | Forward-only, where chosen, is stated explicitly and the plan covers time-to-fix instead                   | read the plan                                  | An unstated choice is an assumption        |
| RR9 | Nothing in the change requires an undocumented manual step                                                 | read the runbook for the release               | The person who knows will be on holiday    |

## Why each one

**RR2 is the item that decides the severity of the next incident.** Rolling the
code back is usually easy; the migration that ran, the message that was
consumed and the email that was sent are not coming back. A team that has
written that list once behaves differently during the incident.

**RR3** is the difference between a procedure and a belief. It takes an
afternoon, once, and it is the only way to find out that the documented command
needs a credential nobody on call has.

**RR6** ties this to the data engineer's work: a rollback is only possible if
the schema the previous version expects still exists. That is not a coincidence
of good practice, it is the reason for the three-deploy rule.
