# Privacy threats

Security threat models ask what an attacker can do. LINDDUN asks what the
system itself does to the people whose data it holds — including when it works
exactly as designed.

| #   | Check                                                                                                                          | How                                                                   | Source                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| PT1 | A data-flow diagram shows every flow of personal data, stores and processors included                                          | read the diagram; every inventory Store and Recipient appears         | LINDDUN — method (DFD-based)                                  |
| PT2 | Linking is considered: can records or actions be tied together to learn more about a person?                                   | per flow and store, a threat ID or "not applicable" with a reason     | LINDDUN — threat types, Linking                               |
| PT3 | Identifying is considered: can a person be identified from data meant to be pseudonymous or aggregate?                         | same                                                                  | LINDDUN — Identifying                                         |
| PT4 | Non-repudiation is considered: does the system make it impossible for a person to deny an action where they should be able to? | same                                                                  | LINDDUN — Non-repudiation                                     |
| PT5 | Detecting is considered: can somebody infer a person's involvement from observation (for example, account existence)?          | same                                                                  | LINDDUN — Detecting                                           |
| PT6 | Data disclosure is considered: excessive collection, storage, processing or sharing                                            | same                                                                  | LINDDUN — Data disclosure                                     |
| PT7 | Unawareness and unintervenability is considered: are people informed and able to act on their data?                            | same; access, rectification and erasure paths exist in the product    | LINDDUN — Unawareness & unintervenability; GDPR Art. 12 to 22 |
| PT8 | Non-compliance is considered, and each item is routed to counsel rather than resolved here                                     | same                                                                  | LINDDUN — Non-compliance                                      |
| PT9 | Every privacy threat has an ID (`P-01`) and a response, as security threats do                                                 | `grep -cE '^\| *P-[0-9]+' privacy/threat-model.md`; no empty response | LINDDUN — method; GDPR Art. 25(1)                             |

## Why each one

**PT3** is the threat most often assumed away. "Pseudonymous" and "aggregate"
data re-identify through small groups, rare combinations and joins with public
data; the check is whether anybody tried.

**PT5** catches the common product leak: a sign-up or password-reset response
that tells anyone whether an email address has an account.

**PT7** connects the model to rights people can actually exercise. A system
that stores personal data with no way for the person to see, correct or delete
it has a design gap, whatever its security.
