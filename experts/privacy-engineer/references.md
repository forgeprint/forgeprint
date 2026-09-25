# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

**Not legal advice.** These are the texts the engineering work is checked
against. Reading them does not make anybody a lawyer, and this expert records
legal conclusions made by counsel or the data protection officer rather than
reaching its own.

OWASP ASVS is tracked in [`docs/review-standards.md`](../../docs/review-standards.md)
and cited at the version recorded there; the requirement IDs below were
re-read in the ASVS 5.0 source. Everything else is listed with the version
current when it was read. **Re-check every 90 days.**

> **Next re-check due: 2026-12-24.** The GDPR amendments proposed in the
> Digital Omnibus package were still under negotiation on 2026-09-25. If they
> have been adopted by the re-check, every article number below is re-read.

## Regulation

| Reference                                                                                                    | Version                                            | Checked    | Used for                                                                                |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| [Regulation (EU) 2016/679 (GDPR)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679) | OJ L 119, 4.5.2016; no amendment in force at check | 2026-09-25 | Articles 4(5), 5, 6(1), 8, 9, 12–22, 25, 28, 30, 35, 39 and Chapter V, as cited per row |

The wording of Art. 19, 25(2), 28(3)(g), 30(1)(f), 35(2), 35(3)(c), 35(11) and
39(1)(c) was matched against the EUR-Lex text on the date above.

## Regulators' guidance

| Reference                                                                                                                                                                                                     | Version                                  | Checked    | Used for                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- | ----------------------------------------------------------- |
| [EDPB Guidelines 4/2019 on Article 25 Data Protection by Design and by Default](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en) | Version 2.0, adopted 2020-10-20          | 2026-09-25 | `minimisation.md` MN3, MN4; `retention-and-deletion.md` RD5 |
| [WP29 Guidelines on DPIA, WP248 rev.01](https://ec.europa.eu/newsroom/article29/items/611236)                                                                                                                 | rev.01, 2017-10-04; endorsed by the EDPB | 2026-09-25 | `dpia-triggers.md` DP4, DP5 — nine criteria, two or more    |

## Standards and methods

| Reference                                                                                            | Version                                               | Checked    | Used for                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| [LINDDUN](https://linddun.org/threat-types/)                                                         | no version on the page; threat types current at check | 2026-09-25 | `privacy-threats.md` PT1 to PT9 — the seven categories as the site names them                                             |
| OWASP ASVS                                                                                           | 5.0.0, via `docs/review-standards.md`                 | 2026-09-25 | 14.1.1 and 14.1.2 (classification and protection requirements), 14.2.7 (retention), 16.1.1 and 16.2.5 (logging) — re-read |
| [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) | current at check                                      | 2026-09-25 | `personal-data-in-logs.md` LG3, LG5 — data to exclude                                                                     |
| [ISO/IEC 29100](https://www.iso.org/standard/85938.html)                                             | 2024, edition 2 (catalogue entry)                     | 2026-09-25 | MN7 — the data minimization principle, by name only. The paywalled text was **not read**, so no clause number is cited    |
| [ISO/IEC 27701](https://www.iso.org/standard/27701)                                                  | 2025, edition 2, standalone PIMS (catalogue entry)    | 2026-09-25 | Not cited by any row. Recorded so nobody cites the 2019 edition as an extension of ISO/IEC 27001; it no longer is         |

## Not cited

- **EDPB Guidelines 1/2024 on legitimate interest** — the consultation version
  of October 2024 was found; whether a final version has been adopted was not
  confirmed. This expert does not choose a lawful basis, so it does not need it.
- **NIST Privacy Framework** — 1.0 is current and 1.1 was an initial public
  draft at check. Not used.

## Deferred to elsewhere

- Legal interpretation: counsel, or the data protection officer. The
  `data-protection-officer` role has no expert in this catalog.
- The security threat model and ASVS requirements: a planned appsec-engineer
  expert.
