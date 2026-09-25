# Design documentation

ASVS 5.0 opens many chapters with a documentation requirement. Each is a design
decision that has to exist before the code that depends on it.

| #   | Check                                                                                        | How                                                                  | Source                   |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| DD1 | Input validation rules are documented for each data item's expected structure                | find the document; pick one field and find its rule                  | OWASP ASVS 5.0.0, 2.1.1  |
| DD2 | Rate limiting and anti-automation against credential stuffing and brute force are documented | find the thresholds and the response                                 | OWASP ASVS 5.0.0, 6.1.1  |
| DD3 | Authorization rules are documented, function-level and data-specific                         | a role × operation table exists                                      | OWASP ASVS 5.0.0, 8.1.1  |
| DD4 | A key management policy and lifecycle exist                                                  | find the policy; it names a key management standard                  | OWASP ASVS 5.0.0, 11.1.1 |
| DD5 | A cryptographic inventory lists keys, algorithms and certificates                            | find the inventory                                                   | OWASP ASVS 5.0.0, 11.1.2 |
| DD6 | A secrets management solution is named, and which secrets it holds                           | find the document; no secret is listed as living in a committed file | OWASP ASVS 5.0.0, 13.3.1 |
| DD7 | Remediation time frames for vulnerable third-party components are documented                 | find the time frames per severity                                    | OWASP ASVS 5.0.0, 15.1.1 |
| DD8 | An inventory of third-party components (an SBOM) is maintained                               | find the SBOM or the command that produces it                        | OWASP ASVS 5.0.0, 15.1.2 |
| DD9 | A logging inventory says what is logged at each layer, where, in which format                | find the inventory                                                   | OWASP ASVS 5.0.0, 16.1.1 |

## Why each one

**DD3** is the document every later authorization bug is measured against.
Without it, "should a viewer be able to export?" is decided by whoever writes
the export endpoint, and reviewed by nobody.

**DD7** turns the scanning policy into something with a deadline. A dependency
finding with no time frame stays open until the next incident.

**DD9** belongs here rather than to operations because what is logged is a
security and privacy decision: the inventory is where a password, a token or
personal data in a log line is caught before it ships.
