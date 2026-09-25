# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. A row that cites nothing is somebody's opinion and does not belong in a
review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

A caveat this expert states rather than hides: technical research has review
methods, not a standard. The two software-engineering guidelines below were
written for academic literature reviews that take months; this expert takes
the parts that survive being done in an afternoon — a question before the
search, a logged search, graded sources, traceable data — and leaves the rest.
GRADE comes from clinical medicine and is used only for its vocabulary of
certainty, not for its procedure.

## Planning and searching

| Reference                                                                                                                                                                                                                       | Version                    | Checked    | Used for                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Kitchenham & Charters, Guidelines for performing Systematic Literature Reviews in Software Engineering](https://legacyfileshare.elsevier.com/promis_misc/525444systematicreviewsguide.pdf), EBSE Technical Report EBSE-2007-01 | Version 2.3, 9 July 2007   | 2026-09-24 | SKILL.md §1, §2, §4 and §6. `question-first.md` Q1, Q2, Q7, Q9 (§5.1, §5.3.2, §5.4, §6.1.4); `search-log.md` L1–L3, L7, L9, L10 (§6.1.2, §6.1.4, Table 2); `source-grading.md` G2, G3, G8 (§6.3.1); `traceable-claims.md` C2–C4, C6, C7 (§6.5.1); `decision-ready.md` D4, D5, D10 (§6.5.6) |
| [Wohlin, Guidelines for snowballing in systematic literature studies and a replication in software engineering](https://doi.org/10.1145/2601248.2601268), EASE 2014                                                             | EASE '14 proceedings, 2014 | 2026-09-24 | SKILL.md §2 and `search-log.md` L6 — a start set, then backward and forward snowballing until an iteration adds nothing                                                                                                                                                                    |

## Grading sources

| Reference                                                                                                                                                                                                                                 | Version                                               | Checked    | Used for                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Garousi, Felderer & Mäntylä, Guidelines for including grey literature and conducting multivocal literature reviews in software engineering](https://doi.org/10.1016/j.infsof.2018.09.006) ([preprint](https://arxiv.org/abs/1707.02553)) | Information and Software Technology 106:101–121, 2019 | 2026-09-24 | SKILL.md §1–§4. The source-grading columns are its Table 7 quality checklist (authority of the producer, methodology, objectivity and vested interest, date, outlet tiers 1–3). Guidelines 2, 4, 6, 7, 8 (the three stopping rules), 12 (traceability links) and 14 are cited by number in the checklists |
| [GRADE Handbook — Handbook for grading the quality of evidence and the strength of recommendations](https://gdt.gradepro.org/app/handbook/handbook.html), Schünemann, Brożek, Guyatt & Oxman (eds.)                                       | Updated October 2013                                  | 2026-09-24 | SKILL.md §5 and `traceable-claims.md` C8–C10 — the four certainty levels (high, moderate, low, very low) and the named reasons to rate down (§5.2: risk of bias, inconsistency, indirectness, imprecision, publication bias). Vocabulary only; the clinical procedure is not used                         |

## Recording the decision

| Reference                                                                                                                        | Version                    | Checked    | Used for                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Michael Nygard, Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)   | original, 2011-11-15       | 2026-09-24 | SKILL.md §6 and `decision-ready.md` D6, D8, D9 — title, context, decision, status (proposed, accepted, superseded) and consequences                                                 |
| [MADR — Markdown Architectural Decision Records](https://adr.github.io/madr/) ([releases](https://github.com/adr/madr/releases)) | 4.0.0, released 2024-09-17 | 2026-09-24 | SKILL.md §6 and §8; `question-first.md` Q5, Q6; `decision-ready.md` D2, D3, D7, D9 — Considered Options, Decision Drivers, Consequences, Confirmation, Pros and Cons of the Options |

## Why this expert exists at all

| Reference                                                                                                                    | Version                | Checked    | Used for                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Anthropic, How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | published 2025-06-13   | 2026-09-24 | The demand evidence: research is the job multi-agent systems are measured on (a lead with subagents beat a single agent by 90.2% on the post's internal research eval), and a dedicated citation step is part of that system. The `tech-research-crew` candidate in the 2026-09-24 crew research was one member short, and this is the member |
| [`skills/catalog-research`](../../skills/catalog-research/SKILL.md)                                                          | as on main, 2026-09-24 | 2026-09-24 | The catalog's own research discipline — fetch the number rather than quote it, record where and when, report disagreement rather than pick the flattering reading. This expert generalises it from catalog demand to any technical question                                                                                                   |

## Deferred to elsewhere

- Turning a brief into documentation for a wider audience:
  [`technical-writer`](../technical-writer/SKILL.md).
- Whether to build the thing at all:
  [`product-manager`](../product-manager/SKILL.md).
- Accepting an architecture decision:
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md) for .NET,
  and the per-language architect slot for other stacks, which nobody has
  filled yet.
- Designing and running a new benchmark: the `performance-engineer` role.
- A formal academic literature review, with a registered protocol and
  multiple independent reviewers: the `literature-reviewer` role, which nobody
  has filled.
