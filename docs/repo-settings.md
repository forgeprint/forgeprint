# Repository settings

The state of the GitHub repository this project is developed in, recorded so
that tooling and contributors can rely on it instead of guessing. Configured by
the core maintainer on 2026-09-22.

Everything here uses features that are free on public repositories. No paid
GitHub feature is assumed anywhere — see
[ADR 0002](decisions/0002-actions-optional.md).

---

## Identity

| Setting        | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Repository     | <https://github.com/forgeprint/forgeprint>                                         |
| Visibility     | Public                                                                             |
| Organization   | `forgeprint`                                                                       |
| Owner          | [@aliosmanmho](https://github.com/aliosmanmho)                                     |
| Default branch | `main`                                                                             |
| Site           | <https://forgeprint.github.io/forgeprint>                                          |
| Topics         | `mcp`, `ai-agents`, `claude-code`, `agent-skills`, `blueprints`, `developer-tools` |

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
- Required status checks: `validate`, `lint-setup`, `similarity`, `setup-test`.
  A working setup is the catalog's central promise, so the check that runs the
  recipes is required like the rest; on a pull request it runs only the
  blueprints that pull request changes, one option combination each. The full
  matrix is not required — it runs Monday mornings and on demand.
- **Do not** turn on "require branches to be up to date before merging". With
  squash merging and auto-merge it only forces a rebase-and-wait cycle on every
  pull request that main moves under, and the checks above do not depend on
  what else landed.

Two things make that list safe to require. Each check is its own job, so it has
its own name and its own red cross. And no check is filtered away by paths:
`setup-test` runs on every pull request and reports `no blueprint changed`
when there is nothing to run, because a required check that never reports
leaves the pull request waiting forever.

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

Enabled, serving <https://forgeprint.github.io/forgeprint> from **branch
`main`, folder `/docs`**, which requires no workflow run.

That means `docs/` is part of the deployment, not a scratch folder:

- `docs/index.html`, `docs/assets/`, `docs/i18n/` — the landing page,
  hand-written. `docs/i18n/<lang>.json` also holds the `site` section the
  generated pages translate their chrome from.
- `docs/index.json` — the generated catalog index, committed.
- `docs/catalog.html`, `docs/b/`, `docs/e/`, `docs/c/`, `docs/i/`,
  `docs/forgeprint.css`, `docs/site.js` — the catalog, generated from the index
  by `pnpm run build-site` and committed. `pnpm run check` fails if the
  committed copy has drifted from the catalog.
- `docs/sitemap.xml`, `docs/llms.txt` — what crawlers and language models read,
  generated by the same build and held by the same check.
- `docs/decisions/` and the other Markdown files are documentation that happens
  to live in the same folder. They are served too, which is harmless.

### The host root: `forgeprint/forgeprint.github.io`

Crawlers read `robots.txt` only at the root of a host, and this site is served
under `/forgeprint/`. The root is a second public repository,
[forgeprint/forgeprint.github.io](https://github.com/forgeprint/forgeprint.github.io),
created on 2026-09-24 and served by Pages from its `main` branch. It holds only
what has to sit there:

| File         | Why                                                                                 |
| ------------ | ----------------------------------------------------------------------------------- |
| `robots.txt` | Allows everything and names `https://forgeprint.github.io/forgeprint/sitemap.xml`   |
| `llms.txt`   | A pointer for tools that look for `/llms.txt`, to the full one under `/forgeprint/` |
| `index.html` | Sends visitors to `/forgeprint/`; `noindex`, with the real page as its canonical    |
| `.nojekyll`  | Serves the files as they are                                                        |

Nothing else belongs there. The sitemap and `llms.txt` are generated here, and
a copy at the root would drift from them. Two things to keep in mind:

- If the site ever moves — a custom domain, a different path — the `Sitemap:`
  line and every link in the root repository move with it.
- The sitemap is also worth submitting by hand, in Google Search Console and
  Bing Webmaster Tools. `robots.txt` makes that optional, not redundant: a
  submitted sitemap is read sooner and its errors are reported.

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
