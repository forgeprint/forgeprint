# 2. Every pipeline step runs locally; GitHub Actions is optional

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer

## Context

Forgeprint's quality gate is its main differentiator: schema validation, a
duplicate report, a setup lint, and a setup test that actually runs the recipe.
If that gate lives inside GitHub Actions workflow YAML, the project stops
working whenever Actions is unavailable, disabled, out of minutes, or simply not
enabled on the account. A catalog that cannot be validated cannot be merged
into, and the project stalls.

The same argument applies to publishing. A Pages site built by a workflow is a
site that disappears when the workflow cannot run.

## Decision

Every pipeline step is a command in `packages/cli` that a maintainer can run on
a laptop:

- `forgeprint validate` — schema and taxonomy conformance
- `forgeprint build-index` — regenerate `docs/index.json`
- `forgeprint similarity <slug>` — duplicate report
- `forgeprint lint-setup <slug>` — setup.md safety and structure rules
- `forgeprint test-setup <slug>` — run the recipe in a clean container
- `forgeprint build-codeowners` — regenerate `.github/CODEOWNERS`

Workflow files never contain logic. They install the toolchain and call these
commands, nothing more.

Generated artifacts that the product depends on — `docs/index.json` and the site
output under `docs/` — are committed to the repository. GitHub Pages deploys
from the branch's `/docs` folder, which requires no workflow run.

No paid or plan-gated GitHub feature is assumed anywhere: no Codespaces, no
large runners, no Copilot code review, no merge queue.

Every design decision is checked against the question "does this still work with
Actions switched off?" A design that fails that question is rejected.

## Consequences

- Contributors get the same feedback locally that CI would give them, before
  pushing.
- When Actions is available, nothing changes: the workflows call the same
  commands and the result is identical.
- `docs/index.json` appears in diffs. Reviewers must accept generated-file noise,
  and the validate command checks that the committed index matches the sources.
- `forgeprint test-setup` needs a container runtime. Without Actions, the
  maintainer runs it locally and pastes the output as a pull request comment;
  this is the one step that is manual in the Actions-less mode.
- The CLI, not the workflow, is the contract. Its output format is part of the
  public interface and changes to it are breaking changes.
