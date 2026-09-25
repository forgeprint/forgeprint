# Incident handling

An incident is handled well when the right people know, one person is making
decisions, users are told what is happening, and somebody writes it all down
as it happens. Each row is checkable afterwards from the incident document.

| #    | Check                                                                                   | How                                                                          | Source                                           |
| ---- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| IH1  | The declaration criteria are written in advance                                         | a list of conditions that make something an incident, in the on-call docs    | SRE Workbook ch. 9 — incident response           |
| IH2  | The incident was declared, with a time, a severity and a commander                      | the incident document's header                                               | SRE Book ch. 14 — managing incidents             |
| IH3  | Roles are named: commander, operations, communications                                  | the document lists who held each and when it changed hands                   | SRE Book ch. 14; SRE Workbook ch. 9              |
| IH4  | The commander did not also run the commands                                             | the timeline shows operations changes made by the operations role            | SRE Book ch. 14 — separation of responsibilities |
| IH5  | A live document holds the timeline in UTC, written during the incident                  | `incidents/<date>-<slug>.md`, timestamps in UTC, entries as the incident ran | SRE Book ch. 14 — a live incident state document |
| IH6  | Mitigation came before root-cause investigation                                         | the timeline shows the first mitigation attempt before deep diagnosis        | SRE Book ch. 14; SRE Workbook ch. 9              |
| IH7  | Stakeholder updates went out on a stated cadence                                        | the communications log, with times                                           | SRE Workbook ch. 9                               |
| IH8  | Handoffs were explicit: the outgoing role holder said so, and the incoming one accepted | entries for each handoff                                                     | SRE Book ch. 14 — clear, live handoff            |
| IH9  | The end was declared, with the SLO back within target and follow-ups assigned           | a resolved timestamp, the SLO state, and named follow-ups                    | SRE Workbook ch. 9                               |
| IH10 | A suspected security incident switched to preserving evidence before changing hosts     | the timeline shows the switch and who from security was involved             | NIST SP 800-61 Rev. 3                            |

## Why each one

**IH4** is the role separation the SRE Book's incident chapter is built
around. A commander who is also typing commands stops seeing the whole
incident; the decision about whether to fail over is taken by whoever
happens to be in the terminal.

**IH5** because a postmortem written from memory is a postmortem of what
people remember. The timeline written during the incident has the dead ends,
the decisions not taken, and the time the alert actually fired.

**IH10** because the operational instinct — roll back, rebuild, restore — is
exactly what destroys the evidence a security investigation needs. NIST SP
800-61 Rev. 3 frames incident response inside the Cybersecurity Framework
2.0; the SRE's part is to recognise the switch and hand over, not to run
that investigation.
