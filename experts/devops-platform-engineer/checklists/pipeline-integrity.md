# Pipeline integrity

Everything that runs in the build is code you are executing with your
credentials. This checklist is about knowing exactly which code that is.

| #    | Check                                                                         | How                                                       | Source                    |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| PI1  | Every action is pinned to a full commit SHA, with the version in a comment    | grep the `uses:` lines for `@v`                           | SLSA v1.2; OWASP A03:2025 |
| PI2  | The SHA matches the tag it claims                                             | resolve the tag and compare; a comment is not a guarantee | —                         |
| PI3  | Every base image is pinned by digest                                          | grep the `FROM` lines                                     | CIS Docker Benchmark      |
| PI4  | A lockfile is committed, and the install fails on drift rather than resolving | read the install step                                     | A03:2025                  |
| PI5  | Tool versions are explicit, not the runner's default                          | read the setup steps                                      | Reproducibility           |
| PI6  | No `latest` anywhere in the pipeline or the manifests                         | grep                                                      | —                         |
| PI7  | No step pipes a download into a shell                                         | grep for the pattern                                      | NIST SSDF                 |
| PI8  | The build is reproducible enough that the same input gives the same artifact  | run it twice and compare                                  | SLSA v1.2                 |
| PI9  | A published artifact carries provenance where the ecosystem supports it       | read the publish step                                     | SLSA v1.2                 |
| PI10 | Updates arrive as reviewed pull requests, not as moving tags                  | a bot is configured                                       | —                         |

## Why each one

**PI2** is the check that makes PI1 mean something, and almost nobody runs it.
The comment saying `# v5.0.0` is written by a human and verified by nobody; if
the SHA is wrong, the pin is pinning something else entirely and looks correct.

**PI10** answers the objection to this whole file. Pinning by digest does make
updates manual, and the answer is not a floating tag — it is automation that
raises a pull request. The update becomes a change somebody reviews, which is
exactly what a moving tag prevents.

**PI7** is the same rule the setup recipes are held to (rule 20), for the same
reason: a step that downloads and executes in one action cannot be reviewed,
only trusted.
