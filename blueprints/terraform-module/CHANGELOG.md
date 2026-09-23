# Changelog — terraform-module

## 1.0.0 — 2026-09-23

First version, and the catalog's first `infra` blueprint and first `iac`.

A reusable Terraform module with validated inputs, an example that consumes it,
and native `terraform test` runs that prove both the outputs and the refusals.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where
`infra` was empty and the open question was how to verify one honestly: a cloud
`apply` needs an account, which the catalog's first filter forbids.

The answer is the reason this blueprint works. `terraform test` runs plan and
apply for real against the `random` provider, so the suite exercises the module
with no credentials and no cloud — including `expect_failures` blocks that
prove the validations refuse bad input, which is the half most modules never
write. `AGENTS.md` says plainly what changes when the resource is replaced by a
cloud one, rather than leaving a reader to discover that the tests quietly
stopped running.

Its recipe runs in CI like every other and nobody has used it in a real
deployment, so it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).
