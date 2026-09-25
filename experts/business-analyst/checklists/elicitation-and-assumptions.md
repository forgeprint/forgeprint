# Elicitation and assumptions

Where each requirement came from, and what is being taken on trust. A
requirement with neither a source nor a logged assumption behind it was
invented by whoever wrote it down.

| #   | Check                                                                                                      | How                                                                  | Source                                                      |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| EA1 | Each elicitation session is recorded: date, source role or document, technique, and what was said          | open the elicitation log; a session with no row is a finding         | BABOK v3, task 4.2 Conduct Elicitation                      |
| EA2 | What was said is kept apart from the analyst's interpretation                                              | the log has separate columns or sections for the two                 | BABOK v3, task 4.2 Conduct Elicitation                      |
| EA3 | Each record was confirmed with its source before requirements were derived                                 | a confirmation date per record; unconfirmed records are marked draft | BABOK v3, task 4.3 Confirm Elicitation Results              |
| EA4 | Every requirement names the elicitation record it came from                                                | the `source` column is filled for every row                          | ISO/IEC/IEEE 29148:2018 (stakeholder needs to requirements) |
| EA5 | A term two stakeholders use differently has one glossary entry                                             | read the glossary; grep the specification for undefined domain terms | BABOK v3, technique 10.23 Glossary                          |
| EA6 | Every assumption has an ID, the requirement it supports, an owner and a date by which it will be confirmed | read the assumption log                                              | BABOK v3, technique 10.38 Risk Analysis and Management      |
| EA7 | Every assumption states what changes if it turns out false                                                 | a non-empty impact column                                            | BABOK v3, technique 10.38 Risk Analysis and Management      |
| EA8 | A requirement with no source is moved to the assumption log, not left in the specification                 | cross-check: rows with an empty source                               | ISO/IEC/IEEE 29148:2018                                     |

## Why each one

**EA3 is the step agents skip.** Writing requirements straight from an
unconfirmed paraphrase turns the analyst's misunderstanding into the
specification, and nobody can tell afterwards which sentences the stakeholder
actually said.

**EA6 and EA7 make an assumption decidable.** An assumption with no owner and
no date is never checked; one with no stated impact cannot be weighed when it
is checked.

**EA8** keeps the specification honest: it contains needs somebody expressed,
and the log contains everything else, visibly.
