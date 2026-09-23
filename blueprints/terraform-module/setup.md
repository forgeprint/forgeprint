# Setup

Creates a reusable Terraform module with validated inputs, an example that
consumes it, and native tests that prove both the outputs and the refusals —
without an account or an `apply` against a cloud.

Run every step from the directory that will hold the module. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Terraform 1.9 or newer.

1. Create `versions.tf` with:

   ```hcl
   terraform {
     # A floor, not a pin: consumers bring their own Terraform and a module
     # that demands one exact version cannot be composed with anything else.
     required_version = ">= 1.9.0"

     required_providers {
       # Providers are pinned exactly. A module is included in somebody else's
       # state, and a provider that drifts underneath it changes their plan
       # without changing their code.
       random = {
         source  = "hashicorp/random"
         version = "3.7.2"
       }
     }
   }
   ```

   Verify: `test -f versions.tf`

2. Create `variables.tf` with:

   ```hcl
   variable "name" {
     description = "Base name for the resources this module creates."
     type        = string

     # Validation belongs here rather than in the caller. A module that
     # accepts anything produces a plan that fails somewhere inside a provider,
     # and the message names a field the caller has never heard of.
     validation {
       condition     = can(regex("^[a-z][a-z0-9-]{1,30}[a-z0-9]$", var.name))
       error_message = "name must be lower-case, start with a letter, and be 3-32 characters of letters, digits and hyphens."
     }
   }

   variable "environment" {
     description = "Which environment this belongs to."
     type        = string

     validation {
       condition     = contains(["dev", "staging", "prod"], var.environment)
       error_message = "environment must be one of: dev, staging, prod."
     }
   }

   variable "tags" {
     description = "Extra tags merged over the ones this module sets."
     type        = map(string)
     default     = {}
   }
   ```

   Verify: `test -f variables.tf`

3. Create `main.tf` with:

   ```hcl
   locals {
     # The caller's tags go last, so they win. A module that overrides what it
     # was given is a module people stop using.
     tags = merge({
       "managed-by"  = "terraform"
       "module"      = "example"
       "environment" = var.environment
     }, var.tags)

     full_name = "${var.name}-${var.environment}"
   }

   resource "random_pet" "suffix" {
     length = 2

     # keepers ties the random value to the inputs: it is regenerated when the
     # name changes and stable when anything else does. Without it, every plan
     # that touches this module proposes a new suffix.
     keepers = {
       name = local.full_name
     }
   }
   ```

   Verify: `test -f main.tf`

4. Create `outputs.tf` with:

   ```hcl
   output "name" {
     description = "The composed resource name."
     value       = local.full_name
   }

   output "unique_name" {
     description = "The composed name with a stable random suffix."
     value       = "${local.full_name}-${random_pet.suffix.id}"
   }

   output "tags" {
     description = "The tags applied, after merging the caller's."
     value       = local.tags
   }
   ```

   Verify: `test -f outputs.tf`

5. Create `examples/basic/main.tf` with:

   ```hcl
   # The example is how the module is read before it is used, and the only
   # place the module is exercised as a consumer would exercise it.
   module "orders" {
     source = "../.."

     name        = "orders"
     environment = "dev"

     tags = {
       owner = "platform"
     }
   }

   output "unique_name" {
     value = module.orders.unique_name
   }
   ```

   Verify: `test -f examples/basic/main.tf`

6. Create `tests/naming.tftest.hcl` with:

   ```hcl
   # Terraform's own test framework. These run plan and apply against the
   # random provider, which needs no account and no cloud — so the refusals
   # below are proved rather than described.
   variables {
     name        = "orders"
     environment = "dev"
   }

   run "composes_the_name" {
     command = apply

     assert {
       condition     = output.name == "orders-dev"
       error_message = "the composed name should join the base name and the environment"
     }
   }

   run "merges_caller_tags_over_defaults" {
     command = apply

     variables {
       tags = { owner = "platform", environment = "overridden" }
     }

     assert {
       condition     = output.tags["owner"] == "platform"
       error_message = "a caller tag should be present"
     }

     assert {
       condition     = output.tags["environment"] == "overridden"
       error_message = "a caller tag should win over the module's own"
     }
   }

   # expect_failures is the half most modules never write: it proves the
   # validation refuses, rather than proving the happy path twice.
   run "rejects_an_unknown_environment" {
     command = plan

     variables {
       environment = "production"
     }

     expect_failures = [var.environment]
   }

   run "rejects_a_name_with_capitals" {
     command = plan

     variables {
       name = "Orders"
     }

     expect_failures = [var.name]
   }
   ```

   Verify: `test -f tests/naming.tftest.hcl`

7. Create `.gitignore` with:

   ```text
   .terraform/
   .terraform.lock.hcl
   *.tfstate
   *.tfstate.*
   *.tfvars
   crash.log
   ```

   Verify: `test -f .gitignore`

8. Create `.github/workflows/ci.yml` with:

   ```yaml
   name: ci

   on:
     push:
     pull_request:

   permissions:
     contents: read

   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
         - uses: hashicorp/setup-terraform@b9cd54a3c349d3f38e8881555d616ced269862dd # v3.1.2
           with:
             terraform_version: '1.9.8'
             terraform_wrapper: false
         - run: terraform fmt -check -recursive
         # -backend=false: a module has no state of its own, and CI must not
         # need credentials for a backend it will never write to.
         - run: terraform init -backend=false
         - run: terraform validate
         - run: terraform test
   ```

   Verify: `test -f .github/workflows/ci.yml`

9. Create `README.md` with:

   ```markdown
   # example module

   A Terraform module with validated inputs and tests that prove both the
   outputs and the refusals.

   ## Use it

   See `examples/basic`. The module takes `name`, `environment` and optional
   `tags`, and returns a composed name, a unique name and the merged tags.

   ## What it does not do

   It creates a `random_pet` and nothing else. It is the shape of a module —
   validated inputs, merged tags, documented outputs, tests — rather than a
   module for any particular cloud. Replace the resource; keep the shape.

   ## Testing

   `terraform test` runs plan and apply against the random provider, so it
   needs no account. `expect_failures` proves the validations refuse bad
   input, which is the half most modules leave untested.
   ```

   Verify: `test -f README.md`

10. Initialise without a backend. A module has no state of its own, and asking for a backend here would mean asking for credentials: `terraform init -backend=false -no-color`
    Verify: `test -d .terraform`

11. Check the formatting, which is the one thing every reviewer otherwise argues about: `terraform fmt -check -recursive -no-color`
    Verify: `terraform fmt -check -recursive -no-color`

12. Validate the configuration: `terraform validate -no-color`
    Verify: `terraform validate -no-color`

13. Run the tests. They apply against the random provider, so they exercise the module for real without an account — and the `expect_failures` blocks prove the validations refuse: `terraform test -no-color`
    Verify: `terraform test -no-color`

14. Initialise the example, which is the only check that the module can actually be consumed by its documented path: `terraform -chdir=examples/basic init -backend=false -no-color`
    Verify: `test -d examples/basic/.terraform`

15. Plan the example without applying anything. Nothing here reaches a cloud, and nothing is created: `terraform -chdir=examples/basic plan -no-color -out=example.tfplan`
    Verify: `test -f examples/basic/example.tfplan`

16. Confirm the plan proposes the one resource this module creates, so a change that quietly adds another is visible. The redirect writes here rather than inside the example, because `-chdir` moves Terraform and not the shell: `terraform -chdir=examples/basic show -json example.tfplan > plan.json`
    Verify: `grep -q '"type":"random_pet"' plan.json`
