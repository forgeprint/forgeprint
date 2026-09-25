# Threat model

The model is a file in the repository, answering four questions. These rows
check that each question was answered rather than gestured at.

| #   | Check                                                                                    | How                                                                             | Source                                                               |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| TM1 | The model is a committed file with the four questions as its headings                    | `grep -c '^## ' security/threat-model.md`; read the four headings               | Threat Modeling Manifesto — the four key questions                   |
| TM2 | A data-flow diagram names external entities, processes, stores and flows                 | read the diagram source; every store and third party appears                    | OWASP Threat Modeling Cheat Sheet — data flow diagrams               |
| TM3 | Trust boundaries are drawn wherever the privilege or the owner changes                   | every flow from an external entity or to a third party crosses a named boundary | OWASP Threat Modeling Cheat Sheet — trust boundaries                 |
| TM4 | Every element that crosses a boundary is considered under all six STRIDE categories      | per element, six cells: a threat ID or "not applicable" with a reason           | OWASP Threat Modeling Cheat Sheet — STRIDE                           |
| TM5 | Every threat has an ID and exactly one response: mitigate, eliminate, transfer or accept | `grep -E '^\| *T-[0-9]+' security/threat-model.md`; no empty response column    | OWASP Threat Modeling Cheat Sheet — response and mitigations         |
| TM6 | Every `mitigate` names an ASVS 5.0 requirement ID                                        | cross-reference with `security/requirements.md`                                 | OWASP ASVS 5.0.0                                                     |
| TM7 | Every `accept` names who accepted it and when                                            | read the accepted rows                                                          | Threat Modeling Manifesto — values (a culture of finding and fixing) |
| TM8 | The model lists what triggers a revisit: new boundary, store, third party or privilege   | a "Revisit when" section exists                                                 | Threat Modeling Manifesto — principles (early and frequent analysis) |
| TM9 | If the system ships an agent or MCP tools, the tool surface is its own boundary          | the DFD shows the model, the tools and what each tool reaches                   | OWASP Top 10 for Agentic Applications 2026                           |

## Why each one

**TM3** decides the quality of everything after it. Threats cluster where
privilege changes; a diagram with no boundaries produces a list of generic
threats that apply to any system and are acted on by nobody.

**TM4** is what makes STRIDE systematic rather than a brainstorm. Six cells per
element, each either a threat or a stated reason it does not apply, is the
difference between "we considered repudiation" and "we did not think of it".

**TM7** keeps "accept" honest. An accepted risk with no owner and no date is
indistinguishable from one nobody noticed.
