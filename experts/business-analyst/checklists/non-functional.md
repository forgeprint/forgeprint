# Non-functional requirements

Quality attributes are the requirements most often written as adjectives.
This checklist walks the model and refuses any adjective without a number.

| #   | Check                                                                                                          | How                                                                                                                                                                | Source                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| NF1 | Each of the nine ISO/IEC 25010:2023 characteristics has a row: requirements, or "not applicable" with a reason | count the rows: functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, safety | ISO/IEC 25010:2023                                                     |
| NF2 | The 2023 names are used, not the 2011 ones                                                                     | grep for "usability" and "portability" as characteristic headings                                                                                                  | ISO/IEC 25010:2023 (replaces 25010:2011)                               |
| NF3 | Every non-functional requirement names a measure and a unit                                                    | read each row; "fast" with no unit is a finding                                                                                                                    | INCOSE GtWR v4, R6 Common Units of Measure; R34 Measurable Performance |
| NF4 | Every value is a target or a range with its tolerance                                                          | read the value column                                                                                                                                              | INCOSE GtWR v4, R33 Range of Values                                    |
| NF5 | Every value states the condition it holds under: load, data volume, environment                                | read the condition column                                                                                                                                          | INCOSE GtWR v4, R34 Measurable Performance                             |
| NF6 | Each non-functional requirement names how it is verified: test, analysis, inspection or demonstration          | the verification column is filled                                                                                                                                  | ISO/IEC/IEEE 29148:2018                                                |
| NF7 | Non-functional requirements were elicited, not only inferred                                                   | each row has a source record, as for functional ones                                                                                                               | BABOK v3, technique 10.30 Non-Functional Requirements Analysis         |

## Why each one

**NF1 is the whole file.** Walking the model is what finds the characteristic
nobody asked about until go-live: safety, compatibility with the system being
replaced, flexibility of deployment. "Not applicable, because" is a fine answer;
silence is not.

**NF5** is the row that makes a performance number mean anything. 400 ms at one
user and 400 ms at two hundred concurrent sessions are different requirements.

**NF2** is small and catches a specification copied from an outdated template.
