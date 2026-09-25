# Changelog

## 1.0.0 — 2026-09-25

The catalog's PHP architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: the PHP line and its end-of-support
  date, the layer enforcement tool, how much of the code may know it runs
  inside Laravel, and what crosses a queue.
- Composer as the build: `composer.lock` committed, `config.platform.php`
  pinned to production, `composer validate --strict`, `composer audit`, and
  the Composer 2.10 dependency policy left on.
- Layers as a failing run: Deptrac 4.7 with `--fail-on-uncovered`, PHPArkitect
  1.3 or Pest 5 architecture tests; PSR-4 mismatches fail
  `dump-autoload --strict-psr`.
- `declare(strict_types=1);` in every file, and a static analysis level that
  only moves up: PHPStan 2.2 with Larastan 3.12, or Psalm 6.18, with a
  baseline that shrinks.
- Laravel kept at the edge: `env()` only in `config/`, Eloquent strictness on
  outside production, no model and no facade in the domain namespace.
- Queue boundaries: jobs carry identifiers, dispatch after commit, time out
  before `retry_after`, and are safe to run twice.
- Ten refusals and five checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every version was read from php.net, Packagist, getcomposer.org or the
vendor's documentation on 2026-09-25. The expert has not been manually
verified against a real project — `provenance: generated` says so
(ADR 0011).
