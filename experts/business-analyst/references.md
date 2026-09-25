# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. Where the text itself could not be read, the row says what was
confirmed instead. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.**

## Business analysis

| Reference                                                                                                                                                     | Version                             | Checked    | Used for                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [IIBA — A Guide to the Business Analysis Body of Knowledge (BABOK Guide)](https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/) | v3 (2015); no v4 published at check | 2026-09-25 | Tasks 4.2, 4.3, 5.1, 5.2, 5.4, 5.5; 2.3 Requirements Classification Schema; techniques 10.1, 10.9, 10.23, 10.30, 10.35, 10.38 |
| [IIBA — requirement types infographic](https://www.iiba.org/contentassets/38e412c7b77d456297d953de5bf5ca61/requirement-types-infograph.pdf)                   | as published at check               | 2026-09-25 | RQ1: the four classes, business, stakeholder, solution (functional, non-functional), transition                               |

The BABOK text on the IIBA KnowledgeHub is behind a member login. Section and
task numbers and titles were confirmed from the KnowledgeHub navigation; the
class definitions in RQ1 from the IIBA infographic and secondary summaries.
No row relies on BABOK wording beyond the task and technique names.

## Requirements engineering

| Reference                                                                                                                    | Version                                                                                                            | Checked    | Used for                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ISO/IEC/IEEE 29148 — Requirements engineering](https://www.iso.org/standard/72089.html)                                     | 29148:2018, second edition. A revision (ISO/IEC/IEEE DIS 29148) was registered 2026-07-13 and is not yet published | 2026-09-25 | RQ2, RQ9, EA4, EA8, TR2, TR3, NF6 — cited at document level: unique identification, verification method, and traceability from stakeholder needs to verification |
| [INCOSE Guide to Writing Requirements](https://www.incose.org/resource/webinar-168-guide-to-writing-requirements-version-4/) | Version 4 (INCOSE-TP-2010-006-04), 2023                                                                            | 2026-09-25 | RQ3 R7, RQ4 R8, RQ5 R9, RQ6 R19 and C5, RQ7 R2, RQ8 R24, RQ9 C7; NF3 R6 and R34, NF4 R33, NF5 R34                                                                |

The ISO page refused automated reading (HTTP 403); the 2018 edition and the
open revision were confirmed from ISO and IEEE catalogue listings, and no ISO
clause number is cited. The INCOSE guide and its summary sheet also refused
automated reading; the rule numbers and titles and the characteristic names
were confirmed from published summaries of version 4, so the rows cite rule
numbers and titles only.

## Quality model

| Reference                                                                        | Version                                                     | Checked    | Used for                                                                                                                                           |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ISO/IEC 25010 — Product quality model](https://www.iso.org/standard/78176.html) | 25010:2023, second edition; cancels and replaces 25010:2011 | 2026-09-25 | NF1, NF2 and SKILL.md §5: nine characteristics, with safety added and usability and portability replaced by interaction capability and flexibility |

Confirmed from the ISO and IEC catalogue listings and the sample pages; the
standard's text beyond the characteristic names was not read.

## Acceptance criteria

| Reference                                                                                                        | Version                              | Checked    | Used for                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Gherkin reference](https://cucumber.io/docs/gherkin/reference/)                                                 | page as read; `Rule` since Gherkin 6 | 2026-09-25 | AC1–AC7: Given without user interaction, Then as observable output, 3–5 steps, short Background, Scenario Outline, Rule |
| [Bill Wake — INVEST in Good Stories, and SMART Tasks](https://xp123.com/invest-in-good-stories-and-smart-tasks/) | original, 2003                       | 2026-09-25 | AC8: Testable                                                                                                           |

## Process models

| Reference                                                                 | Version                                                                                                         | Checked    | Used for                                                                                                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [OMG Business Process Model and Notation](https://www.omg.org/spec/BPMN/) | 2.0.2, formal/2013-12-09 (dated December 2013; the OMG page lists January 2014); latest formal version at check | 2026-09-25 | PM1–PM5: §9.3 sequence flows stay inside a pool, §9.4 message flows connect separate pools only, §8.4.13 the default flow carries no condition |

The BPMN clauses were read in the specification PDF on the check date.

## Deferred to elsewhere

- Problem framing, metrics, prioritisation: [`product-manager`](../product-manager/references.md).
- Delivery planning: [`technical-program-manager`](../technical-program-manager/SKILL.md).
- Security requirements: [`security-reviewer`](../security-reviewer/references.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
