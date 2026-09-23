# Terraform Module — agent context

A reusable Terraform module. Read this before adding a variable or a resource.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
versions.tf       the Terraform floor and the pinned providers
variables.tf      the inputs, each with a description and a validation
main.tf           the resources, and the tag merge
outputs.tf        the outputs, each with a description
examples/basic/   how a consumer uses it, and the only consumer-side check
tests/            terraform test: outputs proved, refusals proved
```

## Rules that are not style preferences

**Validate inputs in the module, not in the caller.** A module that accepts
anything produces a plan that fails somewhere inside a provider, with a message
naming a field the caller has never heard of. A `validation` block fails at the
edge, in words the caller wrote.

**The caller's tags go last in `merge`.** A module that overrides what it was
given is a module people route around. The test asserts this.

**`required_version` is a floor; providers are pinned exactly.** A module is
included in somebody else's state. A floor lets them bring their own Terraform;
an unpinned provider changes their plan without changing their code.

**Every variable and output has a description.** They are the module's
documentation — `terraform-docs` and the registry both read them, and a module
whose outputs are unexplained gets used wrongly rather than not at all.

**`keepers` on anything random.** Without it the value is regenerated on every
plan that touches the module, and every plan proposes a change.

**Write the refusals as tests.** `expect_failures` is the half most modules
never write: without it the suite proves the happy path twice and proves
nothing about the validation.

## Testing without an account

`terraform test` runs plan and apply for real, against whichever providers the
module uses. This one uses `random`, so the whole suite runs with no
credentials and no cloud — which is why it can run in this catalog's CI at all.

Replace `random_pet` with a cloud resource and that stops being true. At that
point the honest options are: keep `command = plan` runs only, use the
provider's mock support, or accept that the tests need credentials and say so
in the README. What is not honest is a test suite that quietly stops running.

## Adding a resource

1. Add the variable, with a description and a validation.
2. Add the resource, tagged from `local.tags`.
3. Add the output, with a description.
4. Add a `run` block asserting the output, and one with `expect_failures` for
   the input the validation should refuse.
5. Update `examples/basic` if the consumer-facing shape changed.

## What this does not do

No backend, no state locking, no cloud provider, no policy checks, no
`terraform-docs` generation, no release to the Terraform registry. It creates a
`random_pet`: it is the shape of a module rather than a module for any
particular cloud. Replace the resource and keep the shape.
