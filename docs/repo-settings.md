# Repository settings

The state of the GitHub repository this project is developed in, recorded so
that tooling and contributors can rely on it instead of guessing. Configured by
the core maintainer on 2026-09-22.

Everything here uses features that are free on public repositories. No paid
GitHub feature is assumed anywhere — see
[ADR 0002](decisions/0002-actions-optional.md).

---

## Identity

| Setting                      | Value                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Repository                   | <https://github.com/forgeprint/forgeprint>                                         |
| Visibility                   | Public                                                                             |
| Organization                 | `forgeprint`                                                                       |
| Owner                        | [@aliosmanmho](https://github.com/aliosmanmho)                                     |
| Default branch               | `main`                                                                             |
| Site (once Pages is enabled) | <https://forgeprint.github.io/forgeprint>                                          |
| Topics                       | `mcp`, `ai-agents`, `claude-code`, `agent-skills`, `blueprints`, `developer-tools` |

There is one maintainer today. The governance model in
[GOVERNANCE.md](../GOVERNANCE.md) already assumes more, because the roles have
to exist before the people do.

---

## Features

| Feature     | State                                       |
| ----------- | ------------------------------------------- |
| Issues      | On — anyone may open one                    |
| Discussions | On                                          |
| Wiki        | Off — documentation lives in the repository |
| Projects    | Off                                         |

---

## Merging

| Setting                                | State                |
| -------------------------------------- | -------------------- |
| Squash merge                           | On — the only method |
| Merge commits                          | Off                  |
| Rebase merge                           | Off                  |
| Squash commit message                  | Pull request title   |
| Auto-merge                             | On                   |
| Delete head branch after merge         | On                   |
| Suggest updating pull request branches | On                   |

Because the squash message is the pull request title, **the pull request title
is the commit message**. It follows
[Conventional Commits](https://www.conventionalcommits.org), the same as the
commits inside the branch.

---

## Branch protection

Ruleset **`protect-main`** (Active) on `main`:

- A pull request is required; no direct push for non-admins.
- 1 approving review.
- Stale approvals are dismissed when new commits are pushed.
- Review from Code Owners is required.
- The most recent push must be approved by someone other than its author.
- All conversations must be resolved.
- Linear history required — consistent with squash-only merging.
- Branch deletion and force pushes are blocked.
- No required status checks **yet**. They are added once the workflows exist
  (phase 3).

**Bypass:** the repository admin role. In practice that is the core
maintainer, which is why phase 0 work is committed to `main` directly. The pull
request flow is the path for contributors, and it is exercised as soon as there
is a second contributor.

Code Owners is what makes `.github/CODEOWNERS` load-bearing rather than
decorative: the root line `* @aliosmanmho` routes every pull request to the
core maintainer, and `forgeprint build-codeowners` adds one line per blueprint
from each manifest's `maintainers` field.

---

## Actions

| Setting                      | State                                          |
| ---------------------------- | ---------------------------------------------- |
| Actions                      | Enabled                                        |
| Allowed actions              | All                                            |
| Action pinning               | **Full-length commit SHA required**            |
| Fork pull request workflows  | Approval required for all outside contributors |
| Default workflow permissions | Read-only                                      |

Two consequences for anyone writing a workflow here:

1. **Pin every `uses:` to a full 40-character commit SHA**, never a tag or a
   branch. A tag can be moved; a SHA cannot.

   ```yaml
   # Correct
   - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

   # Rejected
   - uses: actions/checkout@v7
   ```

   The version comment after the SHA is for humans; the SHA is what runs.

2. **A workflow that needs write access asks for it explicitly** with a
   `permissions:` block, because the default is read-only.

Workflows will only ever call the CLI commands. They contain no logic of their
own, so that every check also runs on a laptop — see
[ADR 0002](decisions/0002-actions-optional.md).

---

## Pages

Not enabled yet. It will be served from **branch `main`, folder `/docs`**,
which requires no workflow run.

That means `docs/` is part of the deployment, not a scratch folder:

- `docs/index.json` — the generated catalog index, committed.
- `docs/index.html` — the site entry point. A placeholder today; generated by
  `packages/site` in phase 3.
- `docs/decisions/` and the other Markdown files are documentation that happens
  to live in the same folder. They are served too, which is harmless.

---

## Security

| Feature                         | State                                          |
| ------------------------------- | ---------------------------------------------- |
| Dependabot alerts               | On                                             |
| Dependabot security updates     | On, grouped                                    |
| Dependabot version updates      | **Off** — routine bumps are pull request noise |
| Dependency graph                | On                                             |
| Secret scanning                 | On                                             |
| Push protection                 | On                                             |
| Malware alerts                  | On                                             |
| Private vulnerability reporting | On                                             |

Security reports go through private vulnerability reporting, never a public
issue.

---

## Sign-off

Commits made through the GitHub web interface are required to carry a DCO
sign-off. Commits made from a terminal are signed off with `git commit -s`.

Enforcement is by convention today. A `Signed-off-by` check moves into the CLI
and the workflows later, so that it is verified the same way locally and in CI.
