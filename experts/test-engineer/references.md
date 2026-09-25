# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was last read, and the date of
that reading. Where a version could not be confirmed at the source, the row
says so rather than guessing. **Re-check every 90 days.**

> **Next re-check due: 2026-12-23.**

## Standards and syllabi

| Reference                                                                                                                             | Version                                                                                                      | Checked    | Used for                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ISTQB Certified Tester Foundation Level syllabus](https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/) | v4.0.1 (the current download on istqb.org; v4.0 was released in 2023, and the page gives no date for v4.0.1) | 2026-09-24 | §1.4.4 traceability, §2.2.3 confirmation and regression testing, §4.2.1–4.2.4 black-box techniques, §4.3.2 branch testing, §4.4.1 error guessing |
| [ISO/IEC/IEEE 29119-4 — Software testing, Part 4: Test techniques](https://www.iso.org/standard/79430.html)                           | 29119-4:2021, second edition (replaces 2015)                                                                 | 2026-09-24 | `test-design-techniques.md` TT1, TT3–TT5, TT7 — techniques as test models that yield coverage items                                              |
| [ISO/IEC/IEEE 29119-1 — Software testing, Part 1: General concepts](https://www.iso.org/standard/81291.html)                          | 29119-1:2022                                                                                                 | 2026-09-24 | `regression-first.md` RF5 — the vocabulary of regression testing                                                                                 |

The ISO pages refused automated reading on the check date (HTTP 403). The
editions above were confirmed from the ISO and IEEE listings in search results
and from national adoptions that name them; the clause text was not read, so
no row cites an ISO clause number.

## Test-driven development

| Reference                                                                             | Version                      | Checked    | Used for                                                                           |
| ------------------------------------------------------------------------------------- | ---------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| Kent Beck, _Test-Driven Development: By Example_, Addison-Wesley, ISBN 978-0321146533 | First edition, November 2002 | 2026-09-24 | SKILL.md §2; `red-green-refactor.md` RG2, RG5, RG8, RG9                            |
| [Kent Beck — Canon TDD](https://newsletter.kentbeck.com/p/canon-tdd)                  | Published 2023-12-11         | 2026-09-24 | The five steps and the named mistakes in SKILL.md §2; `red-green-refactor.md`; RF2 |

## Test doubles and the shape of a unit test

| Reference                                                                                                     | Version                 | Checked    | Used for                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| [Martin Fowler — Test Double](https://martinfowler.com/bliki/TestDouble.html)                                 | 2006-01-17              | 2026-09-24 | The five kinds, from Meszaros; `test-doubles.md` DO1                                                             |
| [Martin Fowler — Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)                  | Last updated 2007-01-02 | 2026-09-24 | State versus behaviour verification; DO2, DO3, and MA6                                                           |
| [Martin Fowler — Unit Test](https://martinfowler.com/bliki/UnitTest.html)                                     | 2014-05-05              | 2026-09-24 | Solitary and sociable tests; `test-doubles.md` DO8                                                               |
| [Martin Fowler — Contract Test](https://martinfowler.com/bliki/ContractTest.html)                             | 2011-01-12              | 2026-09-24 | Checking a double against the real thing; `test-doubles.md` DO6                                                  |
| [Martin Fowler — Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html) | Published 2011-04-14    | 2026-09-24 | Wrapping the system clock so a test can replace it; DO7 applies the same reasoning to randomness and identifiers |
| [Ham Vocke — The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)       | Published 2018-02-26    | 2026-09-24 | Public interface only, narrow integration tests, pushing a failure down a level; DO4, DO5, DO8, DO9, RF3, MA6    |

## Mutation testing

| Reference                                                                                                                   | Version                                                       | Checked    | Used for                                                                    |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| [Stryker — Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/) | Documentation current at check                                | 2026-09-24 | The state names and the score formula; `mutation-analysis.md` MA2, MA3, MA5 |
| [Stryker — Equivalent mutants](https://stryker-mutator.io/docs/mutation-testing-elements/equivalent-mutants/)               | Documentation current at check                                | 2026-09-24 | `mutation-analysis.md` MA4                                                  |
| [StrykerJS — Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/)                                      | StrykerJS 10.0.0 (latest release at check); Stryker.NET 5.0.0 | 2026-09-24 | `mutate` to limit the run to changed files; MA1, MA7                        |
| [PIT (pitest)](https://pitest.org/)                                                                                         | 1.30.0 (latest release at check)                              | 2026-09-24 | The JVM tool named in SKILL.md §6; MA1, MA7                                 |

Stryker4s is named in SKILL.md §6 from the Stryker documentation's list of
supported platforms; its release number was not checked.

## Deferred to elsewhere

- Test strategy, end-to-end tests, pipeline signal, unstable-test policy and the
  release gate: [`qa-automation-lead`](../qa-automation-lead/SKILL.md), with its
  own references.
- Security testing and the standards it rests on:
  [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- Whether code is structured so it can be tested at all:
  [`dotnet-senior-architect`](../dotnet-senior-architect/SKILL.md) for .NET.
