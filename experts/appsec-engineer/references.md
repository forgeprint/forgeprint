# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

The OWASP, NIST and SLSA rows are tracked in
[`docs/review-standards.md`](../../docs/review-standards.md) and are cited here
at the versions recorded there, not copied. The ASVS requirement IDs this
expert names were re-read in the ASVS 5.0 source on 2026-09-25. The other rows
are listed with the version current when they were read. **Re-check every 90
days.**

> **Next re-check due: 2026-12-24.** The standards list's own re-check is due
> 2026-12-21; if it has passed, say so in the deliverable.

## Tracked in `docs/review-standards.md`

| Reference                             | Version (as recorded there)      | Used for                                                                          |
| ------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| OWASP ASVS                            | 5.0.0 (May 2025)                 | Every requirement ID; the level definitions; `design-documentation.md` throughout |
| OWASP Top 10:2025                     | 2025 edition, final January 2026 | `scanning-policy.md` SP1 (A02), SP2 and SP5 (A03)                                 |
| OWASP API Security Top 10             | 2023 edition                     | `security-requirements.md` SR5 (API1 BOLA)                                        |
| OWASP Top 10 for Agentic Applications | 2026 edition                     | `threat-model.md` TM9 — the tool surface as a boundary                            |
| NIST SSDF, SP 800-218                 | v1.1                             | SR8 (PW.1), SP4 (PW.7), SP6 (RV.2), SP8 (RV.1), ST6 and ST8 (PW.8)                |
| SLSA                                  | v1.2                             | SP5 — pinning the tools that run in the build                                     |

## ASVS 5.0 requirements re-read at the source

Read in the `OWASP/ASVS` repository, `5.0/en/`, on 2026-09-25. Chapter list
confirmed: V1 Encoding and Sanitization to V17 WebRTC.

| ID            | What it requires                                                        | Used in  |
| ------------- | ----------------------------------------------------------------------- | -------- |
| 2.1.1         | Documented input validation rules per data item                         | DD1      |
| 6.1.1         | Documented rate limiting and anti-automation against credential attacks | DD2      |
| 8.1.1         | Documented function-level and data-specific authorization rules         | DD3, ST3 |
| 8.2.1         | Function-level access restricted to explicit permissions                | ST3      |
| 8.2.2         | Data-specific access restricted to explicit permissions (IDOR, BOLA)    | SR5, ST4 |
| 11.1.1–11.1.2 | Key management policy; cryptographic inventory                          | DD4, DD5 |
| 13.3.1        | A secrets management solution for backend secrets                       | DD6, SP1 |
| 15.1.1        | Documented remediation time frames for vulnerable components            | DD7, SP7 |
| 15.1.2        | An inventory (SBOM) of third-party libraries                            | DD8, SP3 |
| 15.2.1        | No component past its documented remediation time frame                 | SP2      |
| 16.1.1        | A logging inventory                                                     | DD9      |
| Levels        | L1, L2, L3; "most applications should be striving to achieve" L2        | SR1      |

## Threat modelling and testing

| Reference                                                                                                            | Version                                     | Checked    | Used for                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/)                                                | no version on the page; current at check    | 2026-09-25 | TM1, TM7, TM8, SR6 — the four questions, values and principles              |
| [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) | current at check                            | 2026-09-25 | TM2 to TM5, SR4, SR7 — DFDs, trust boundaries, STRIDE, the four responses   |
| [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)                        | v4.2 stable (5.0 in development, not cited) | 2026-09-25 | ST2 to ST5, ST7 — test IDs; WSTG-ATHZ-02 and -04 confirmed in the v4.2 tree |

## Scanners — one pinned example each

The policy is the requirement; the tool is an example. Each was checked at its
upstream release page on 2026-09-25.

| Tool                                                          | Version                       | Kind                      |
| ------------------------------------------------------------- | ----------------------------- | ------------------------- |
| [gitleaks](https://github.com/gitleaks/gitleaks/releases)     | v8.30.1, released 2026-03-21  | Secret scanning (SP1)     |
| [OSV-Scanner](https://github.com/google/osv-scanner/releases) | v2.6.0, released 2026-09-14   | Dependency scanning (SP2) |
| [Semgrep](https://github.com/semgrep/semgrep/releases)        | v1.178.0, released 2026-09-23 | SAST (SP4)                |

## Deferred to elsewhere

- Reviewing a change against these requirements:
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Personal data, retention, DPIAs: a planned privacy-engineer expert.
- Penetration testing: refused for this catalog as dual-use
  (`docs/research/2026-09-24-expansion-plan.md`, D8).
