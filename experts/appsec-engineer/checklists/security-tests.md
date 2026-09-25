# Security tests

A requirement is verified by a test in the project's own suite, run against
the project's own test environment. Nothing here is an attack on a system.

| #   | Check                                                                                              | How                                                                            | Source                                                     |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| ST1 | Every requirement ID has at least one test named for it                                            | for each ID in `security/requirements.md`, `grep -rn 'asvs_<id>'` finds a test | OWASP ASVS 5.0.0                                           |
| ST2 | Negative cases come first: the request that must be refused                                        | read the test; it asserts a refusal and the observable result                  | OWASP WSTG v4.2                                            |
| ST3 | An authorization matrix test covers every role against every sensitive operation                   | find one table-driven test with the matrix from the authorization document     | OWASP ASVS 5.0.0, 8.1.1 and 8.2.1; WSTG v4.2, WSTG-ATHZ-02 |
| ST4 | Object-level authorization is tested across tenants or owners                                      | a test requests another owner's object and expects refusal                     | OWASP ASVS 5.0.0, 8.2.2; WSTG v4.2, WSTG-ATHZ-04           |
| ST5 | Each test names the WSTG test ID its method comes from, where one exists                           | read the test's docstring or name                                              | OWASP WSTG v4.2                                            |
| ST6 | Security tests run in CI on every pull request, not in a separate occasional job                   | read the workflow                                                              | NIST SSDF SP 800-218 v1.1, PW.8                            |
| ST7 | Tests run against the project's own test environment and data, never a shared or production system | read the test configuration's base URL and credentials source                  | OWASP WSTG v4.2 — introduction, scope                      |
| ST8 | A security test that fails blocks the merge like any other test                                    | it is in the required checks                                                   | NIST SSDF SP 800-218 v1.1, PW.8                            |

## Why each one

**ST3** catches the class of bug that no scanner finds: a role that can reach
an operation nobody intended it to. The matrix is the authorization document
from `design-documentation.md` DD3, executed.

**ST4** is the single most valuable security test in a multi-tenant system. It
is short to write, and without it object-level authorization is verified by
hope.

**ST7** is the boundary that keeps this expert on the right side of D8. A
security test in the project's suite verifies the project; the same request
against somebody else's system is an attack.
