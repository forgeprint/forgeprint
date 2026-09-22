# 5. Setup tests run in a clean directory, not in a container

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Amends: CLAUDE.md §3.2, which says "CI runs the recipe in a clean container"

## Context

The catalog's central claim is that a `setup.md` is a script, not a description:
a machine follows it on an empty directory and ends up with a working project.
`forgeprint test-setup` is what turns that claim into a check, and the claim is
worth nothing until something other than a careful human runs it.

The obvious environment is a container, and that is what the project kickoff
called for. It does not work, for a reason that is not incidental:

**Recipes use containers themselves.** All three official blueprints end by
building an image and starting it to read `/health` back — which is exactly the
verification that makes them trustworthy. Inside a container there is no Docker
daemon. The usual workarounds are worse than the problem: mounting the host
socket hands the recipe root on the host, and Docker-in-Docker adds a
privileged service to every run.

There is also a second-order problem. A container image has to come from
somewhere. The manifest does not declare one, and inferring it from
`requires_tools` means the tooling guessing at an environment the blueprint
author never stated — a guess that fails quietly, in CI, on somebody else's
contribution.

## Decision

`forgeprint test-setup` runs a recipe in a **fresh temporary directory on the
current machine**, and treats the environment as a precondition rather than
something it provides:

1. It reads `requires_tools` and checks each tool is present and new enough. A
   missing or too-old tool is a refusal with the tool and the version named —
   never a silent pass and never an attempt to install anything.
2. It creates an empty directory, runs every step there, and runs each step's
   verification command immediately after it.
3. It reports the first failing step by number, with the command, the exit code
   and the output. A recipe that fails is not merged.
4. It deletes the directory afterwards, unless `--keep` is passed.

The isolation that matters here is a clean working directory plus a declared
toolchain. Process isolation is not what the check is about: the failure mode
being caught is "step 7 does not work", not "step 7 is hostile". Hostile steps
are `lint-setup`'s job, and it refuses privilege escalation, pipes from a
download, recursive deletes, writes outside the project, and hosts that are not
package registries — before anything is executed.

`--image <ref>` runs the recipe inside a container instead, for a blueprint
whose recipe does not itself need Docker. It stays available; it is not the
default.

## Consequences

- The runner, not the tooling, provides the toolchain. The setup-test workflow
  installs what today's catalog needs, and a blueprint that needs something
  else fails with a message naming the missing tool. That is a readable
  failure, but it does mean adding a blueprint in a new language means adding a
  step to that workflow.
- Recipes that build and run containers can be tested end to end, which is the
  only way the blueprints that do so can be `verified`.
- A recipe can see whatever the machine has installed. A step that depends on a
  tool it did not declare passes locally and fails on a clean runner — which is
  the right way round, and is why `requires_tools` is checked first.
- Running the full option matrix is slow, so it is not the default: a pull
  request tests one combination per blueprint, and `--all-options` runs on
  demand and on a schedule.
- Because execution needs a machine with the tools, this remains the one check
  that a maintainer without Actions runs locally and pastes into the pull
  request, exactly as [ADR 0002](0002-actions-optional.md) anticipated.
