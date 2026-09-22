# Changelog — @forgeprint/site

The static site generator behind https://forgeprint.github.io/forgeprint. It is
private: the site is generated into `docs/` and committed, so Pages deploys
from the branch and needs no build service (ADR 0002).

## 0.2.0 — 2026-09-22

First working version; the version number follows the workspace.

- `forgeprint-site` generates `docs/index.html`, `docs/b/<slug>.html` and
  `docs/forgeprint.css` from `docs/index.json`. The index page filters in the
  browser, with no script fetched from anywhere.
- Each blueprint page shows the tags as labels rather than identifiers, the
  `get_blueprint` call that fetches it with an option already chosen, and links
  every file to its folder on GitHub.
- `--check` reports drift instead of writing, so a stale committed site fails
  `pnpm run check` rather than going unnoticed.
- The output is deterministic, which is what makes that check meaningful.

## 0.1.0 — 2026-09-22

Placeholder package, published nowhere: an `index.html` entry point so that
Pages could be enabled on `main` + `/docs` before there was a site to serve.
