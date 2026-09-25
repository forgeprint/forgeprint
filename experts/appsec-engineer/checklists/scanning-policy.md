# Scanning policy

Scanners find what rules describe. The policy decides what their findings
mean, which is the part most projects never write down.

| #   | Check                                                                                          | How                                                                         | Source                                          |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| SP1 | Secret scanning runs on every pull request and blocks on a finding                             | read the workflow; e.g. `gitleaks` 8.30.1 pinned, also as a pre-commit hook | OWASP ASVS 5.0.0, 13.3.1; OWASP Top 10:2025 A02 |
| SP2 | Dependency scanning runs on every pull request against a vulnerability database                | read the workflow; e.g. OSV-Scanner 2.6.0 pinned                            | OWASP Top 10:2025 A03; OWASP ASVS 5.0.0, 15.2.1 |
| SP3 | An SBOM is produced from the lockfile, not from a hand-written list                            | find the command and its output                                             | OWASP ASVS 5.0.0, 15.1.2                        |
| SP4 | SAST runs with rules chosen for the stack                                                      | read the workflow and the rule configuration; e.g. Semgrep 1.178.0 pinned   | NIST SSDF SP 800-218 v1.1, PW.7                 |
| SP5 | Every scanner is pinned to a version, and the action that runs it by commit SHA                | read the workflow                                                           | SLSA v1.2; OWASP Top 10:2025 A03                |
| SP6 | The policy states which severities fail the build                                              | read the policy file                                                        | NIST SSDF SP 800-218 v1.1, RV.2                 |
| SP7 | Remediation time frames per severity are stated, and the triage owner is named                 | read the policy file                                                        | OWASP ASVS 5.0.0, 15.1.1                        |
| SP8 | A false positive is suppressed for one finding, in the repository, with a reason and an expiry | grep the suppression files; no rule is disabled globally                    | NIST SSDF SP 800-218 v1.1, RV.1                 |

## Why each one

**SP1 blocks, the others may not.** A leaked secret is exploitable the moment
it is pushed to a public repository; the build failing is cheaper than
rotating it. Dependency and SAST findings can be triaged against a deadline.

**SP7** is what stops scanning becoming noise. A finding with no owner and no
deadline is one nobody will fix, and a backlog of them teaches the team to
ignore the scanner.

**SP8** keeps suppression reviewable. A rule disabled in configuration hides
every future instance; a single suppression with an expiry comes back for a
second look.
