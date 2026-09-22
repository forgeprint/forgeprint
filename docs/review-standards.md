# Review standards

The references a blueprint is reviewed against. **Every checklist item in a
review cites one of these** — an item that cites nothing is somebody's opinion
and does not belong in a report ([ADR 0010](decisions/0010-review-standards.md)).

Each entry carries the version that was current when it was last checked, and
the date of that check. A standard cited at the wrong version is worse than no
citation, because it sounds authoritative. **Re-check every 90 days**; the
roadmap carries the reminder.

> **Next re-check due: 2026-12-21.** Update the version, the link and the date
> for each row, and remove anything that has been superseded.

---

## Application security

| Reference                                                                                 | Version                                                 | Checked    | What it is used for here                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)   | 5.0.0 (May 2025)                                        | 2026-09-22 | The verification checklist itself: authentication, session management, access control, validation, cryptography, configuration. Around 350 requirements over 17 chapters — a blueprint is reviewed against the chapters its `requirements` claim                                                                     |
| [OWASP Top 10:2025](https://owasp.org/Top10/2025/)                                        | 2025 edition, final January 2026                        | 2026-09-22 | The risk categories a finding is classified under. Two are new and both land on this catalog: **A03 Software Supply Chain Failures** (pinning, provenance) and **A10 Mishandling of Exceptional Conditions**. **A02 Security Misconfiguration** rose to second. SSRF was absorbed into **A01 Broken Access Control** |
| [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x00-header/) | 2023 edition — still current, no 2026 edition published | 2026-09-22 | For `project_type: api`. Three of the top five are authorization failures; **API1 BOLA** is the single most common API vulnerability. Also API4, unrestricted resource consumption, which is where rate limiting belongs                                                                                             |

## Agents, LLMs and MCP

| Reference                                                                                                                                           | Version                           | Checked    | What it is used for here                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)                                                                            | 2025 edition                      | 2026-09-22 | Prompt injection, sensitive information disclosure, supply chain, system prompt leakage, and **excessive agency** — split in the 2025 edition into excessive functionality, excessive permissions and excessive autonomy. The tool-surface review for `project_type: agent` starts here |
| [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)                           | 2026 edition, released 2025-12-10 | 2026-09-22 | Threats specific to autonomous systems rather than to a single model call. Relevant to every blueprint that ships MCP tools, and to Forgeprint's own server                                                                                                                             |
| [OWASP: A Practical Guide for Secure MCP Server Development](https://genai.owasp.org/resource/a-practical-guide-for-secure-mcp-server-development/) | current at check                  | 2026-09-22 | The concrete review of an MCP server: tool boundaries, argument validation, what a tool may reach                                                                                                                                                                                       |
| [MCP specification — security best practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)           | spec revision **2026-07-28**      | 2026-09-22 | Transport security, OAuth 2.1 token handling, session isolation. The spec recommends token expiry and rotation without mandating them, so a blueprint that ships bearer tokens is reviewed on what it does about lifecycle                                                              |
| [NSA/CISA — Model Context Protocol security](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF)                         | June 2026                         | 2026-09-22 | A government-issued threat model for MCP deployments; useful as a second opinion where the OWASP guidance is silent                                                                                                                                                                     |

## Supply chain and the build

| Reference                                                         | Version          | Checked    | What it is used for here                                                                                                                                                                                               |
| ----------------------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NIST SSDF, SP 800-218](https://csrc.nist.gov/projects/ssdf)      | v1.1             | 2026-09-22 | The practice groups a recipe is measured against: protect the software, produce well-secured software, respond to vulnerabilities. Mostly reached here through pinning, provenance and a documented disclosure process |
| [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final) | final, July 2024 | 2026-09-22 | The SSDF community profile for generative AI and dual-use foundation models. Applies to `project_type: agent` blueprints                                                                                               |
| [SLSA](https://slsa.dev/spec/v1.2/)                               | v1.2             | 2026-09-22 | Build and source tracks, and the provenance attestation format. What a blueprint's CI workflow is reviewed against, and the target for Forgeprint's own npm publishing                                                 |

## Containers

| Reference                                                           | Version                                                                                                         | Checked    | What it is used for here                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker) | v1.8.0 — **verify the control numbers at the link before citing one**; sources disagree between 1.6.0 and 1.8.0 | 2026-09-22 | Image and Dockerfile controls: a non-root user, a pinned base image, no secrets in layers, minimal contents. Only the image-and-Dockerfile scope applies — the daemon and host controls are the reader's environment, not the blueprint's |

## Platform guidance

| Reference                                                                                | Version          | Checked    | What it is used for here                                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ASP.NET Core security documentation](https://learn.microsoft.com/aspnet/core/security/) | current at check | 2026-09-22 | Authentication and authorization, data protection, and the framework's own guidance on secrets. The `dotnet-*` blueprints are reviewed against it rather than against general advice |
| [.NET secrets guidance](https://learn.microsoft.com/aspnet/core/security/app-secrets)    | current at check | 2026-09-22 | Where configuration belongs, and why a connection string is never in a committed file                                                                                                |

## Architecture

| Reference                                                                                           | Version            | Checked    | What it is used for here                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [The Twelve-Factor App](https://12factor.net/)                                                      | current            | 2026-09-22 | Configuration from the environment, one codebase, explicit dependencies, disposability. The most cited rows in these reviews are III (config) and II (dependencies) |
| [C4 model](https://c4model.com/)                                                                    | current            | 2026-09-22 | How a blueprint describes its own shape when it needs a diagram: context, container, component, code — and what level of detail belongs in `AGENTS.md`              |
| [Hexagonal architecture (ports and adapters)](https://alistair.cockburn.us/hexagonal-architecture/) | original, Cockburn | 2026-09-22 | Dependency direction, and whether a blueprint's boundary between domain and infrastructure survives the first real change                                           |
| [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)  | original, Martin   | 2026-09-22 | The same question stated as the dependency rule. Used where a blueprint claims layering that its folder structure does not have                                     |
| [ADR practice](https://github.com/joelparkerhenderson/architecture-decision-record)                 | current            | 2026-09-22 | Whether a blueprint's decisions are recorded where somebody can disagree with them, rather than implied by the code                                                 |

---

## How a reference is used

**Cite the requirement, not the document.** "ASVS 5.0" is not a finding;
"ASVS V2.1.1 — the recipe stores a password with a reversible encoding" is.

**Applicability is part of the finding.** The CIS Docker Benchmark's host
controls do not apply to a blueprint, because a blueprint does not configure
the reader's daemon. Say which scope a control comes from.

**Where references disagree, say so.** The report names both and the
maintainer chooses in writing. A silent choice between two standards is the
kind of judgment this document exists to remove.

**A reference that has moved invalidates the finding that cited it.** That is
the reason for the 90-day re-check, and the reason each row carries a date
rather than "current".
