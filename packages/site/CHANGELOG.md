# Changelog — @forgeprint/site

The static site generator behind https://forgeprint.github.io/forgeprint. It is
private: the site is generated into `docs/` and committed, so Pages deploys
from the branch and needs no build service (ADR 0002).

## 0.2.2 — 2026-09-22

- The install line carries the Windows PowerShell form, where a bare `--` is
  swallowed before `claude` sees it.

## 0.2.1 — 2026-09-22

- Each blueprint page credits its maintainer — "Blueprint by @handle", with the
  avatar from `github.com/<login>.png`, which needs no API call at build time
  and no script in the page.
- The front page credits the featured contributors from `forgeprint.json`.
- The front page shows the open blueprint requests: a dated snapshot in the
  HTML, replaced on load by the live queue read from the public issues API and
  cached in `sessionStorage` for ten minutes. No token, and no workflow with
  write access (ADR 0007). Issue titles are user input, so the list is built
  with `textContent` and `innerHTML` is never assigned.

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
