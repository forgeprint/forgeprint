# Secrets in the pipeline

The pipeline holds production credentials and runs code from every pull
request. Both halves of that sentence are the problem.

| #   | Check                                                                                  | How                                                         | Source           |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| SC1 | Every workflow declares `permissions` explicitly, narrowly, per job                    | grep for the block; absent means default                    | Least privilege  |
| SC2 | No trigger gives a fork's pull request access to a secret                              | read every trigger; this is the first thing to check        | OWASP A03:2025   |
| SC3 | Untrusted input is never interpolated into a `run:` step                               | grep for expressions inside script blocks                   | Script injection |
| SC4 | Untrusted input that is needed arrives via an environment variable, quoted             | read the steps that use a branch name, title or body        | Script injection |
| SC5 | Short-lived federated credentials are used where the target supports them              | read the cloud and registry authentication steps            | Least privilege  |
| SC6 | No secret is echoed, written to a file that is uploaded, or passed as a build argument | read the steps and the artifact uploads                     | §5b              |
| SC7 | A secret that has ever appeared in a log is rotated                                    | ask; masking is not deletion                                | —                |
| SC8 | The deploy credential reaches this service and no more                                 | read what it can do, not what it is used for                | Blast radius     |
| SC9 | Secret scanning runs, and so does a local hook                                         | check both; push protection refuses after the commit exists | §5b              |

## Why each one

**SC2 is the one that turns a public repository into a credential leak**, and
it is a configuration choice rather than a bug. A workflow that runs on a
fork's pull request with access to secrets is arbitrary code execution with
your credentials, available to anybody with an account.

**SC3 and SC4** are the same finding twice because the fix has two halves.
A branch name is an attacker-controlled string; interpolated into a shell step
it is a command. Put it in an environment variable and quote the reference.

**SC7** is about what people believe masking does. The log is stored, it was
transmitted, and a mask applies to the display. The only response to an exposed
secret is a new secret.
