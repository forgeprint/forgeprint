# Terraform Module

A reusable Terraform module with validated inputs, an example that consumes it,
and native tests that prove both the outputs and the refusals — without an
account and without applying anything to a cloud.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has used it in a real deployment
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- Extracting a pattern that three environments already repeat into a module
  with a name and a contract.
- A team whose modules currently have no tests, because testing Terraform
  looked like it needed a cloud account. It does not, and this shows the shape.
- An internal registry of modules where the interesting work is the input
  contract rather than the resources.
- Learning what a module owes its callers: validation at the edge, tags that
  merge the right way round, outputs with descriptions, and a suite that proves
  the refusals.

## What it is NOT for

- **Any particular cloud.** It creates a `random_pet`. That is deliberate — it
  is the shape of a module, not a module for AWS, Azure or GCP. Replace the
  resource; keep the shape.
- **Root modules.** No backend, no state locking, no workspace layout. This is
  a module to be included, not a configuration to be applied.
- **Policy as code.** No Sentinel, no OPA, no `tfsec` or Checkov in CI.
  Worth adding and not here.
- **Publishing to the Terraform registry.** No tagging convention, no
  `terraform-docs` generation, no registry metadata.
- **Anything that proves cloud behaviour.** The tests prove the module's own
  logic. What a provider does with a valid plan is not tested and cannot be
  without an account.

## Pros

- **The refusals are tested.** `expect_failures` asserts that an unknown
  environment and a capitalised name are rejected. Most modules test the happy
  path twice and never find out that a validation block has a typo in its
  condition.
- **The tests need no credentials.** `terraform test` runs plan and apply
  against the `random` provider, so the module is exercised for real — and
  `AGENTS.md` says exactly what changes when the resource becomes a cloud one,
  rather than leaving somebody to discover that the suite quietly stopped
  running.
- **Validation lives at the edge.** A bad `name` fails with the message the
  module author wrote, not with a provider error naming a field the caller has
  never seen.
- **The caller's tags win.** Asserted by a test, because a module that
  overrides what it was given is a module people route around.
- **`keepers` on the random resource**, so the value is stable across plans.
  Without it every plan that touches the module proposes a change, and people
  learn to ignore the diff.
- **The example is initialised and planned in the recipe**, which is the only
  check that the module can actually be consumed by its documented path.
- **The plan is inspected, not just produced.** The recipe reads the JSON and
  asserts the resource type, so a change that quietly adds a second resource is
  visible.
- **Providers pinned exactly, Terraform floored not pinned** — the right way
  round for something included in somebody else's state.

## Cons

- **Nobody has deployed with it.** See the notice above.
- **`random_pet` is not infrastructure.** The blueprint is honest about this
  and it still means the reader does the interesting half. A module that
  created a real bucket would show provider-specific naming rules, IAM and
  lifecycle, and could not be tested here.
- **`terraform test` applies.** Against `random` that is free and instant;
  against a cloud it is a real resource and a real bill. The moment the
  resource changes, the test strategy is a decision — and the blueprint tells
  you that, which is not the same as solving it.
- **No static analysis.** `tfsec`, Checkov and `terraform-docs` all belong in a
  module's CI and none are here.
- **One example.** `examples/basic` and nothing showing composition, `for_each`
  or a second environment.
- **`.terraform.lock.hcl` is git-ignored.** For a module that is defensible —
  the consumer's lock file is the one that matters — and it is the opposite of
  what a root module should do. The `.gitignore` does not explain the
  distinction.

## Compared with the alternatives here

Nothing else in this catalog is `infra` — this is the first. Every other
blueprint that ships a container assumes something already runs it; this is the
first one about the something.
