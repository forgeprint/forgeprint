# Decision ready

Research that ends in a reading list has handed the work back. The brief is
ready when the person who decides can decide from it, and can see what they
are deciding against.

| #   | Check                                                                                      | How                                                  | Source                                                              |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------- |
| D1  | The answer is one paragraph at the top, with its certainty                                 | read the first screen                                | Garousi et al. 2019, Guideline 14 — style matched to the audience   |
| D2  | At least two options, each with evidence for and against, every point citing a source id   | count them                                           | MADR 4.0.0 — Considered Options; Pros and Cons of the Options       |
| D3  | Doing nothing is an option, or the brief says why it is not                                | find it                                              | MADR 4.0.0 — Considered Options                                     |
| D4  | "What would change the answer" is written: the finding or event that would flip it         | find the section                                     | Kitchenham & Charters 2007, §6.5.6 — sensitivity analysis           |
| D5  | The answer is checked against dropping the weakest sources; if it flips, the brief says so | remove tier-3 and vested rows and re-read the answer | Kitchenham & Charters 2007, §6.5.6 — sensitivity analysis           |
| D6  | An architectural decision is drafted as an ADR: context, decision, status, consequences    | read the headings                                    | Nygard 2011 — Documenting Architecture Decisions                    |
| D7  | The ADR uses the MADR 4.0.0 sections, including Confirmation                               | read the headings                                    | MADR 4.0.0                                                          |
| D8  | The ADR is `status: proposed`; the owner accepts it, not this expert                       | read the front matter                                | Nygard 2011 — status proposed, accepted, superseded                 |
| D9  | Consequences include the negative ones                                                     | find at least one                                    | Nygard 2011 — consequences; MADR 4.0.0 — Consequences               |
| D10 | Not found and not verified are carried into the brief, not left in the working notes       | grep for both headings in the handed-over file       | Kitchenham & Charters 2007, §6.1.4 — the thoroughness of the search |

## Why each one

**D4 is the row that makes the brief outlive its date.** A decision taken on
evidence that has since changed is only found out if somebody wrote down
which evidence it rested on and what would overturn it. One sentence does it.

**D2** is the refusal that matters most. A recommendation with one option
considered compared nothing; it is a preference with footnotes.

**D8** keeps the boundary honest. The researcher who also accepts the decision
has no reason to report the evidence against it, and the reader has no way to
tell whether they did.
