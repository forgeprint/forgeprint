# Personal data in logs and telemetry

Logs are copied to more places, kept longer and read by more people than the
database they describe. What reaches them is a design decision.

| #   | Check                                                                                                                    | How                                                                                                      | Source                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| LG1 | A logging inventory says which fields may be logged, where, and for how long                                             | find the inventory; it references the data inventory's categories                                        | OWASP ASVS 5.0.0, 16.1.1                    |
| LG2 | Logging is enforced by the data's protection level: some fields never, some masked or hashed                             | read the logger configuration or wrapper that applies the rule                                           | OWASP ASVS 5.0.0, 16.2.5; 14.1.2            |
| LG3 | Credentials, tokens, session identifiers and special-category data are never logged                                      | `grep -rnE 'log.*(password\|token\|session\|authorization)' src/`; read each hit                         | OWASP Logging Cheat Sheet — data to exclude |
| LG4 | Inventory fields do not appear in log calls unmasked                                                                     | `grep -rnE 'log(ger)?\.(info\|warn\|error\|debug).*\b(email\|phone\|address\|ip)\b' src/`; read each hit | OWASP ASVS 5.0.0, 16.2.5                    |
| LG5 | Error trackers and APM tools scrub request bodies, headers and user fields, in configuration committed to the repository | read the SDK initialisation                                                                              | OWASP Logging Cheat Sheet; GDPR Art. 28     |
| LG6 | Analytics events carry a pseudonymous identifier, not contact data                                                       | read the event payload definitions                                                                       | GDPR Art. 4(5); Art. 5(1)(c)                |
| LG7 | Log and telemetry retention is set, and appears in the data inventory                                                    | read the log sink's retention setting                                                                    | GDPR Art. 5(1)(e)                           |

## Why each one

**LG2** makes the rule mechanical. A convention that "we don't log emails" is
broken by the first `logger.info(user)`; a wrapper or a redaction processor
that applies the protection level is not.

**LG4** is a grep because it finds most violations in seconds; reading each hit
is what finds the rest, such as a whole request object logged at debug level.

**LG5** because the error tracker receives the request that failed — with its
body, headers and user — unless somebody configured it not to.
