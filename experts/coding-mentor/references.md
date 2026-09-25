# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Research papers do not have versions; each row gives the publication year and
venue, which is what identifies the claim. **Re-check every 90 days** for
retractions, corrections, and newer syntheses that change the reading.

> **Next re-check due: 2026-12-24.**

A caveat this expert states rather than hides: these are findings from
education research, most of them in school or university settings and many
outside programming. They are the best-supported guidance available, not
guarantees about any one learner, and the rows cite what each study found
rather than treating it as a rule of nature.

## Cognitive load: worked and faded examples

| Reference                                                                                                                                                                                                                                        | Version | Checked    | Used for                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------- | -------------------------------------------------------------------------------------- |
| [Sweller and Cooper, "The use of worked examples as a substitute for problem solving in learning algebra", _Cognition and Instruction_ 2(1), 59–89](https://www.tandfonline.com/doi/abs/10.1207/s1532690xci0201_3)                               | 1985    | 2026-09-25 | SKILL.md §4; WE1, WE6 — the worked-example effect                                      |
| [Renkl, Atkinson, Maier and Staley, "From example study to problem solving: Smooth transitions help learning", _Journal of Experimental Education_ 70(4), 293–315](https://www.tandfonline.com/doi/abs/10.1080/00220970209599510)                | 2002    | 2026-09-25 | WE2–WE4 — fading; backward fading better than forward                                  |
| [Atkinson, Renkl and Merrill, "Transitioning from studying examples to solving problems: Effects of self-explanation prompts and fading worked-out steps", _Journal of Educational Psychology_ 95(4), 774–783](https://eric.ed.gov/?id=EJ678596) | 2003    | 2026-09-25 | GH4 — prompting the learner to explain the principle behind a step                     |
| [Kalyuga, Ayres, Chandler and Sweller, "The expertise reversal effect", _Educational Psychologist_ 38(1), 23–31](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_4)                                                                  | 2003    | 2026-09-25 | SKILL.md §1; PB1, WE5 — guidance that helps novices can hinder learners with the skill |

## Programming pedagogy

| Reference                                                                                                                                                                                                                | Version | Checked    | Used for                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------- | -------------------------------------------------------------- |
| [Sentance, Waite and Kallia, "Teaching computer programming with PRIMM: a sociocultural perspective", _Computer Science Education_ 29(2–3), 136–176](https://www.tandfonline.com/doi/full/10.1080/08993408.2019.1608781) | 2019    | 2026-09-25 | SKILL.md §2; PB2–PB7 — Predict, Run, Investigate, Modify, Make |

## Checking understanding

| Reference                                                                                                                                                                                                          | Version | Checked    | Used for                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------- | ------------------------------------------------------------------ |
| Anderson and Krathwohl (eds.), _A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives_, Longman                                                               | 2001    | 2026-09-25 | SKILL.md §5; CU1, CU2, CU5 — the six cognitive process levels      |
| Krathwohl, "A Revision of Bloom's Taxonomy: An Overview", _Theory Into Practice_ 41(4), 212–218                                                                                                                    | 2002    | 2026-09-25 | CU2, CU3 — the levels as a hierarchy                               |
| [Roediger and Karpicke, "Test-enhanced learning: Taking memory tests improves long-term retention", _Psychological Science_ 17(3), 249–255](https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2006.01693.x) | 2006    | 2026-09-25 | SKILL.md §5; CU4, CU6, CU7 — retrieval beats restudy after a delay |

## Help seeking

| Reference                                                                                                                                                                                                                                                                      | Version | Checked    | Used for                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------- | ---------------------------------------------------------------------------------------- |
| [Aleven, Roll, McLaren and Koedinger, "Help Helps, But Only So Much: Research on Help Seeking with Intelligent Tutoring Systems", _International Journal of Artificial Intelligence in Education_ 26(1), 205–223](https://link.springer.com/article/10.1007/s40593-015-0089-1) | 2016    | 2026-09-25 | SKILL.md §3; GH1, GH2, GH6 — levels of on-demand hints ending in a bottom-out hint       |
| [Baker, Corbett, Koedinger and Wagner, "Off-Task Behavior in the Cognitive Tutor Classroom: When Students 'Game The System'", _Proceedings of CHI 2004_, 383–390](https://dl.acm.org/doi/10.1145/985692.985741)                                                                | 2004    | 2026-09-25 | SKILL.md §3; GH3, GH5 — gaming the system most strongly associated with reduced learning |

The two help-seeking papers were confirmed from their abstracts and publisher
listings; the full texts are behind publisher logins. The rows cite only what
the abstracts and the widely reported findings state.

## Academic integrity

| Reference                                                                                                                                                                 | Version             | Checked    | Used for                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- | ------------------------------------------------------------------------------------ |
| [International Center for Academic Integrity, _The Fundamental Values of Academic Integrity_](https://academicintegrity.org/aws/ICAI/asset_manager/get_file/911282?ver=1) | Third edition, 2021 | 2026-09-25 | SKILL.md §7; AI1–AI6 — honesty, trust, fairness, respect, responsibility and courage |

## Deferred to elsewhere

- Documentation style for tutorials that are published rather than taught:
  [`technical-writer`](../technical-writer/references.md).
- Test-driven development as an engineering practice:
  [`test-engineer`](../test-engineer/references.md).
