# Container image

Only the image-and-Dockerfile scope applies here. The daemon and host controls
in the benchmark are the reader's environment, not the artifact's.

| #    | Check                                                                         | How                                               | Source                       |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| CN1  | The image runs as a non-root user                                             | there is a `USER` line and it is not root         | CIS Docker Benchmark         |
| CN2  | The base image is pinned by digest                                            | read the `FROM` lines                             | CIS Docker Benchmark         |
| CN3  | The build is multi-stage; no toolchain in the final image                     | read the stages                                   | Minimal contents             |
| CN4  | No secret in any layer — not in `ARG`, `ENV`, or a file a later layer deletes | read every layer; the deleted file is still there | CIS Docker Benchmark         |
| CN5  | A `.dockerignore` excludes `.git`, environment files and local configuration  | it exists and covers them                         | Build context size and leaks |
| CN6  | One process, and signals are handled so the orchestrator can stop it          | read the entrypoint                               | Graceful shutdown            |
| CN7  | A health check exists, and matches what the orchestrator uses                 | compare the image and the manifest                | —                            |
| CN8  | The filesystem is read-only except where it must not be                       | read the runtime configuration                    | Least privilege              |
| CN9  | The image is scanned, and the result is looked at                             | the scan runs and somebody reads it               | NIST SSDF                    |
| CN10 | No package manager cache or build artifact left in the final layer            | check the image size against what it should be    | Minimal contents             |

## Why each one

**CN4** catches the mistake that looks fixed. A secret copied in, used, and
removed by a later `RUN rm` is still in the earlier layer, and anybody who can
pull the image can read it. The deletion changes the final filesystem, not the
history.

**CN6** is why a container that "takes ages to stop" is a design problem rather
than a platform one. A process that does not handle the termination signal is
killed after the grace period, mid-request, every deploy.

**CN1** is the cheapest control on this list and the most frequently missing.
It costs one line and it is the difference between a compromised process and a
compromised container.
