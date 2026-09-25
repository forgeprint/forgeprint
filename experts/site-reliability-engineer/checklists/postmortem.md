# Postmortem

A postmortem exists to make the same failure less likely, and cheaper when
it happens anyway. It succeeds when its actions are done; the document is
the means.

| #    | Check                                                                                   | How                                                                           | Source                                            |
| ---- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| PM1  | A postmortem exists for every incident the policy says needs one                        | compare the incident list with `postmortems/`; EB5's threshold included       | SRE Book ch. 15; SRE Workbook, appendix B         |
| PM2  | Impact is stated in SLO terms: which SLO, how much budget, how many users, how long     | the impact section has numbers                                                | SRE Workbook ch. 10 — postmortem culture          |
| PM3  | The timeline runs from the first signal to the declared end, in UTC                     | the timeline section; detection time and how it was detected are both present | SRE Book ch. 15; example postmortem               |
| PM4  | Contributing factors are plural, and the trigger is one of them                         | the section lists more than one; none is "human error"                        | SRE Workbook ch. 10                               |
| PM5  | No person is named as a cause; people appear only as roles                              | grep the document for names; the language is about systems                    | SRE Book ch. 15 — blameless culture               |
| PM6  | What went well, what went badly, and where we got lucky are all present                 | three headings, each non-empty                                                | SRE Book ch. 15; example postmortem               |
| PM7  | Every action has an owner, a priority and a ticket                                      | each action row has all three; a row missing one is a finding                 | SRE Workbook ch. 10                               |
| PM8  | Actions prevent, detect or mitigate — and at least one improves detection or mitigation | classify each action                                                          | SRE Workbook ch. 10                               |
| PM9  | The postmortem was reviewed and shared beyond the team                                  | a review date and the audience                                                | SRE Book ch. 15 — collaborate and share knowledge |
| PM10 | Action tickets from the last three postmortems are tracked to closure                   | open the tickets; count closed against open                                   | SRE Workbook ch. 10                               |

## Why each one

**PM4 and PM5** together are what "blameless" means in practice. The moment
the answer is "the engineer ran the wrong command", the search stops, and
the system that let one command take the service down stays as it was.
The Workbook's examples of bad postmortems are mostly ones that stopped
there.

**PM7** because an action without an owner is nobody's, one without a
priority is never first, and one without a ticket is forgotten after the
review meeting. All three are needed for PM10 to be checkable at all.

**PM10** is the only row that measures whether the postmortem worked. A
beautifully written document whose actions are still open next quarter has
made the next incident no less likely.
