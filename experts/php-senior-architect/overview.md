# PHP Senior Software Architect

## What it changes

An agent working on a Laravel application without this expert writes code
that runs: a controller that validates, queries and dispatches; `env()` where
a value is needed; a job that takes the model it was handed; files with no
`declare(strict_types=1)`. Every piece works on the laptop. None of it fails a
build when the design breaks — and several pieces break only in production,
after `config:cache`, on a newer PHP, or when a worker retries.

This expert moves the design into things that fail:

- **Four decisions first** — the PHP line and its end-of-support date, the
  layer tool, how far Laravel reaches, and what crosses a queue.
- **Composer as the build** — lock committed, `config.platform.php` pinned to
  production, `validate --strict`, `audit --locked`, the dependency policy on,
  plugins allowed by name.
- **Layers as a failing run** — Deptrac with `--fail-on-uncovered`,
  PHPArkitect or Pest architecture tests, with a baseline that shrinks, and
  `--strict-psr` for the PSR-4 mismatch a case-insensitive disk hides.
- **Types declared and ratcheted** — `strict_types` in every file, PHPStan with
  Larastan (or Psalm) at level 8 or stricter, and a level and baseline that
  only move one way.
- **Laravel at the edge** — `env()` only in `config/`, Eloquent strictness on
  outside production, no framework types in the domain.
- **Queue boundaries** — identifiers not snapshots, dispatch after commit,
  timeout below `retry_after`, every job safe to run twice.

## What it fits

- Starting a Laravel 13 application on PHP 8.4 or 8.5, before the layers exist.
- Reviewing a PHP codebase's structure, or a change that adds a package, a
  queue job or a new namespace.
- Upgrading PHP or Laravel — the migration-plan deliverable, with the platform
  pin moved last.
- Framework-agnostic PHP libraries and services: §2–§4 and three of the five
  checklists apply unchanged.

## What it does not fit

- **Symfony, Laminas or WordPress applications.** Composer, types and layers
  transfer; the Laravel edge and queue checklists do not, and the expert says
  so rather than forcing them.
- **Application security** — authentication, CSRF, authorization policies:
  `security-reviewer` and `docs/review-standards.md`.
- **Schema design and query tuning** — `sql-data-engineer`.
- **PHP-FPM, OPcache and server tuning** — `devops-platform-engineer` and
  `performance-engineer`.
- **Scaffolding a new project.** That is a blueprint's job (`laravel-web-app`
  is an open pull request); this expert reviews what a scaffold produces.

## Pros and cons

**In its favour:** every rule is a grep, a command exit code or a line in a
configuration file, so it can be checked after the conversation ends. It
catches the three Laravel failures that pass every local test — `env()` after
`config:cache`, a job running before its transaction commits, and a timeout
longer than `retry_after`.

**Against it:** it adds three dev tools (a layer checker, a static analyser,
a formatter rule) that a small application may not want on day one, and
raising an existing codebase to PHPStan level 8 is weeks, not an afternoon —
the baseline makes that adoptable, not free. It prefers a framework-free
domain, which a team that chose "the Laravel way" will find heavy; the ADR in
§1 is where that is decided, and LE6 is skipped when it is.
