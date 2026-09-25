# Changelog — go-http-service

## 1.2.0 — 2026-09-25

Three findings from the Go experts' checklists (`go-backend-engineer` GL4–GL6
and EW2, `go-senior-architect` TG3), closed in one change and reviewed in
[2026-09-25](../../docs/reviews/go-http-service/2026-09-25.md). A feature and
an update: the service gains a shutdown, and the Go floor rises.

**Graceful shutdown.** The process used to stop when it was stopped, dropping
whatever was in flight. `main` now derives its context from
`signal.NotifyContext` for SIGTERM and SIGINT, and the new
`internal/server.Run` turns cancellation into `http.Server.Shutdown` with an
eight-second deadline — inside the ten seconds `docker stop` waits and the
thirty a Kubernetes pod gets. Shutdown closes the listener first, so nothing
new is accepted while the drain runs; past the deadline `Close` cuts off what
is left and `Run` returns the deadline error. `ReadHeaderTimeout` is kept and
moves with the server into `internal/server`.

- `TestShutdownFinishesTheRequestInFlightAndRefusesNewOnes` holds a request in
  a handler, cancels the context the way SIGTERM does, proves a new
  connection is refused and `Run` has not returned, then releases the request
  and asserts it completed with 200 before `Run` returns nil.
- `TestShutdownGivesUpAtItsDeadline` proves the drain is bounded: a request
  that never finishes makes `Run` return `context.DeadlineExceeded` rather
  than keep the process alive.
- Step 27 proves it against the running container. `docker stop` exits 0 even
  when it had to kill, so the step reads the container's own exit code: 0
  means the service drained and exited inside the window, 137 that it was
  killed.

**Errors matched with `errors.Is`.** `err != http.ErrServerClosed` became
`errors.Is(err, http.ErrServerClosed)`, in `internal/server`. The rest of the
generated code was read for other `==`/`!=` comparisons against an error
value, and there are none left: every other comparison is against `nil`.
Step 19 runs golangci-lint's `errorlint` (v2.14.0, via `go run` from the
module proxy, so nothing is added to `go.mod`), and the generated CI runs the
same line. One thing worth knowing about it: errorlint allow-lists a
comparison made directly on the result of `ListenAndServe` or `Serve`, because
the standard library documents that error as unwrapped — so it would not have
flagged the original line. It does flag the comparison where it now sits,
which receives the error through a channel. Both behaviours were checked
against v2.14.0 on 2026-09-25.

**Go 1.27.** 1.25 no longer gets security fixes: go.dev lists 1.27.1 and
1.26.8 as the supported releases. Pins moved, each read live on 2026-09-25:

- `go.mod` go directive 1.25 → **1.27**, and `requires_tools` `go>=1.27`.
- Builder image `golang:1.25-alpine` → **`golang:1.27.1-alpine`**, the
  current patch on Docker Hub, pinned to the patch rather than the minor so
  the image is the same one on every build. Step 16's comparison now reads the
  minor out of a patch-level tag.
- Generated CI `go-version` '1.25' → **'1.27.1'**, to match the image.
- `actions/setup-go` v5.5.0 → **v7.0.0**
  (`b7ad1dad31e06c5925ef5d2fc7ad053ef454303e`): v5.5.0 runs on node20, which
  GitHub is retiring from its runners, and v7.0.0 runs on node24. The same pin
  the catalog's own setup-test moves to.

Checked and not moved, because nothing gave a reason: gin v1.12.0 and
golang-jwt v5.3.1 are still the latest on the module proxy;
`actions/checkout` v5.0.0 already runs on node24 (v7.0.1 is out, and a major
bump with no fix behind it is churn); `gcr.io/distroless/static-debian12:nonroot`
is still published.

The recipe goes from 24 steps to 28: two files for `internal/server`, the
errorlint step, and the stop-and-read-the-exit-code step, which replaces the
forced removal of the check container.

## 1.1.0 — 2026-09-24

The routing convention became a check, from the architecture review
([2026-09-23](../../docs/reviews/go-http-service/2026-09-23.md), finding 1).

Every route is protected by where it is declared — inside the group that
carries `RequireBearer` — and nothing stopped somebody declaring one outside
it. That is the single mistake the convention cannot prevent, and it is silent:
the route works, the tests pass, and the endpoint is public.

- **`TestEveryRouteOutsideTheAllowListNeedsAToken`** walks `router.Routes()`,
  which Gin exposes, and fails on any route that answers a request with no
  token. `GET /health` is the allow-list, written out, so making a route public
  is now a line somebody has to add on purpose. It also refuses to pass on an
  empty route table: a loop over nothing asserts nothing, which is how a check
  like this stops working without ever failing.

No change to the service. The recipe gains one test and no step.

## 1.0.0 — 2026-09-23

First version.

An HTTP service on Gin 1.12 with bearer token verification, a distroless
non-root container, and tests that prove an unauthenticated request is refused
— asserted once in `httptest` and again against the running image.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where Go was
one of the two languages most missing from `api` and `gin` carried 89.2k stars.
Its recipe runs in CI like every other and nobody has run a service on it, so
it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Two things came out of building it rather than describing it.

**The `go` directive is set by the dependencies, not by preference.**
`go mod init` writes whatever toolchain the author happens to have, and
`go get` then raises the floor because gin 1.12 requires 1.25. The Dockerfile's
builder image has to satisfy that floor, and when it does not the failure
surfaces inside Docker as `go.mod requires go >= 1.25.0` — which reads like a
network problem. Step 13 now compares the two and fails here instead.

**Authentication is a property of the group**, because Gin has no equivalent of
the fallback policy the .NET blueprints use. A route declared on the router
rather than on the group is public and nothing warns you, so the rule is stated
twice in `AGENTS.md` and the container check asserts the 401.
