# Changelog — go-http-service

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
  is now a line somebody has to add on purpose.

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
