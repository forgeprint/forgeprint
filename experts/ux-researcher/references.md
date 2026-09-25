# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.**

A caveat this expert states rather than hides: user research has two ISO
standards and a large practitioner literature. The practitioner sources below
(Nielsen Norman Group, MeasuringU) are named, dated guidance, not standards,
and each row says what it is used for and where its limits are.

## Standards

| Reference                                                                                              | Version                                                | Checked    | Used for                                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [ISO 9241-210 — Human-centred design for interactive systems](https://www.iso.org/standard/77520.html) | 9241-210:2019, second edition (replaces 9241-210:2010) | 2026-09-25 | RP1, RP7, TP7 and SKILL.md §1: the study placed in the human-centred design cycle; document level                            |
| [ISO 9241-11 — Usability: Definitions and concepts](https://www.iso.org/standard/63500.html)           | 9241-11:2018                                           | 2026-09-25 | RP4, RP5, TP4, TP5, TP8, SY6, SY7: usability for specified users, goals and context; effectiveness, efficiency, satisfaction |
| [GDPR — Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)                       | as in force at check                                   | 2026-09-25 | PC1–PC8: Articles 5(1)(c), 5(1)(e), 7(1)–(3), 8, 9. Cited for the rules it states, not as legal advice                       |

The ISO texts were not read; editions were confirmed from ISO and national
catalogue listings, and the usability definition from published quotations of
9241-11:2018. No ISO clause number is cited. The text of GDPR Articles 5 and 7 was read (via the gdpr-info.eu consolidated text); Articles 8 and 9 are cited by title.

## Method guidance

| Reference                                                                                                                                           | Version                         | Checked    | Used for                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| [Christian Rohrer — When to Use Which User-Experience Research Methods](https://www.nngroup.com/articles/which-ux-research-methods/)                | 2022-07-17, reviewed 2026-07-15 | 2026-09-25 | RP2, RP3, RP6: attitudinal–behavioural, qualitative–quantitative, context of use |
| [Marieke McCloskey — Turn User Goals into Task Scenarios for Usability Testing](https://www.nngroup.com/articles/task-scenarios-usability-testing/) | 2014-01-12                      | 2026-09-25 | TP1–TP3: realistic, actionable, no clues                                         |
| [Jakob Nielsen — Thinking Aloud: The #1 Usability Tool](https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/)                      | 2012-01-15                      | 2026-09-25 | TP6: facilitator prompts can change behaviour                                    |
| [Jakob Nielsen — Severity Ratings for Usability Problems](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/)         | 1994-11-01                      | 2026-09-25 | SY5: the 0–4 scale; frequency, impact, persistence                               |

## Sample size

| Reference                                                                                                                                                                                        | Version    | Checked    | Used for                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [Jakob Nielsen — Why You Only Need to Test with 5 Users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)                                                               | 2000-03-18 | 2026-09-25 | SS1–SS3, SS6, SS7: five per round, the 31% average discovery rate from Nielsen and Landauer, 3–4 per group with several groups, iteration |
| [Raluca Budiu and Kate Moran — How Many Participants for Quantitative Usability Studies: A Summary of Sample-Size Recommendations](https://www.nngroup.com/articles/summary-quant-sample-sizes/) | 2021-07-25 | 2026-09-25 | SS4, SS5, SU7: about 40 for a binary metric at 15% margin and 95% confidence                                                              |

An older NN/g article (Nielsen, _Quantitative Studies: How Many Users to
Test?_, 2006-06-25) recommended 20 participants at a 90% confidence level. The
2021 summary is used because it states its assumptions; a plan that accepts
the 2006 trade-off should say so.

## System Usability Scale

| Reference                                                                                                                                                                         | Version    | Checked    | Used for                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------- |
| John Brooke, "SUS: A 'quick and dirty' usability scale", in Jordan, Thomas, Weerdmeester and McClelland (eds.), _Usability Evaluation in Industry_, Taylor & Francis, pp. 189–194 | 1996       | 2026-09-25 | SU1–SU4, SU8: the items, when to administer (before any debriefing), the scoring rule |
| [Jeff Sauro — Measuring Usability with the System Usability Scale (SUS)](https://measuringu.com/sus/)                                                                             | 2011-02-03 | 2026-09-25 | SU3, SU5, SU6: not a percentage; the average of 68 across about 500 studies           |

Brooke's text was read in a copy hosted by the
US Agency for Healthcare Research and Quality; the scoring and administration sentences are quoted
from it.

## Synthesis

| Reference                                                                                                                                                                                      | Version | Checked    | Used for                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------------ |
| [Virginia Braun and Victoria Clarke — Using thematic analysis in psychology, _Qualitative Research in Psychology_ 3(2), 77–101](https://www.tandfonline.com/doi/abs/10.1191/1478088706qp063oa) | 2006    | 2026-09-25 | SY1–SY4: the phases from familiarisation to reviewing themes |

## Deferred to elsewhere

- WCAG 2.2 and accessibility conformance: [`docs/review-standards.md`](../../docs/review-standards.md)
  and the `accessibility-specialist` role.
- Problem framing and what to build: [`product-manager`](../product-manager/references.md).
- Why visual design is not an expert in this catalog: decision D4 in
  [`docs/research/2026-09-24-expansion-plan.md`](../../docs/research/2026-09-24-expansion-plan.md).
