# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Package versions were read from Packagist, the PHP line from php.net
and Composer's from getcomposer.org on the date shown. **Re-check every 90
days**, and at two known dates: on 2026-12-31 PHP 8.2 leaves security
support and PHP 8.4 leaves active support; on 2027-12-31 PHP 8.3 leaves
security support. A new PHP minor is normally released each November.

> **Next re-check due: 2026-12-24.**

## Language and platform

| Reference                                                                                                      | Version                                                                                                 | Checked    | Used for                    |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | --------------------------- |
| [PHP supported versions](https://www.php.net/supported-versions.php)                                           | 8.2.34 (security to 2026-12-31), 8.3.33 (to 2027-12-31), 8.4.26 (to 2028-12-31), 8.5.11 (to 2029-12-31) | 2026-09-25 | SKILL.md §1 decision 1; CD4 |
| [PHP manual — type declarations: strict typing](https://www.php.net/manual/en/language.types.declarations.php) | PHP 8.5                                                                                                 | 2026-09-25 | SKILL.md §4; TS1            |
| [PHP manual — classes: readonly classes](https://www.php.net/manual/en/language.oop5.basic.php)                | PHP 8.2 and later                                                                                       | 2026-09-25 | TS8                         |
| [PHP manual — backed enumerations](https://www.php.net/manual/en/language.enumerations.backed.php)             | PHP 8.1 and later                                                                                       | 2026-09-25 | TS8                         |
| [PSR-4: Autoloader](https://www.php-fig.org/psr/psr-4/)                                                        | accepted standard                                                                                       | 2026-09-25 | SKILL.md §3; LR6, LR7       |

## Composer

| Reference                                                                  | Version                                 | Checked    | Used for                                                                            |
| -------------------------------------------------------------------------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| [Composer — basic usage](https://getcomposer.org/doc/01-basic-usage.md)    | Composer 2.10.3 (2.2 LTS to 2026-12-31) | 2026-09-25 | CD1, CD2 — commit the lock file; install reads it                                   |
| [Composer — config](https://getcomposer.org/doc/06-config.md)              | 2.10.3                                  | 2026-09-25 | CD3 `platform`; CD8 `policy` (advisories blocked by default); CD9 `allow-plugins`   |
| [Composer — command-line interface](https://getcomposer.org/doc/03-cli.md) | 2.10.3                                  | 2026-09-25 | CD5 `check-platform-reqs`; CD6 `validate`; CD7 `audit --locked`; LR6 `--strict-psr` |

## Layer enforcement

| Reference                                                            | Version          | Checked    | Used for                                                                               |
| -------------------------------------------------------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------- |
| [Deptrac](https://deptrac.github.io/deptrac/)                        | 4.7.2 (PHP 8.2+) | 2026-09-25 | SKILL.md §3; LR1–LR5 — layers, ruleset, `--fail-on-uncovered`, baseline formatter; LE6 |
| [PHPArkitect](https://github.com/phparkitect/arkitect)               | 1.3.1            | 2026-09-25 | LR1, LR2 — `phparkitect check`                                                         |
| [Pest — architecture testing](https://pestphp.com/docs/arch-testing) | Pest 5.2.1       | 2026-09-25 | SKILL.md §3; LR1, LR3, LR8 (`toOnlyBeUsedIn`), TS2 (`toUseStrictTypes`), LE6           |

## Static analysis and style

| Reference                                                                                                  | Version | Checked    | Used for                                          |
| ---------------------------------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------- |
| [PHPStan — rule levels](https://phpstan.org/user-guide/rule-levels)                                        | 2.2.15  | 2026-09-25 | SKILL.md §4; TS3, TS4 — levels 0–10, 8 = nullable |
| [PHPStan — the baseline](https://phpstan.org/user-guide/baseline)                                          | 2.2.15  | 2026-09-25 | TS6                                               |
| [PHPStan — ignoring errors](https://phpstan.org/user-guide/ignoring-errors)                                | 2.2.15  | 2026-09-25 | TS7 — identifiers on `@phpstan-ignore`            |
| [Larastan](https://github.com/larastan/larastan)                                                           | 3.12.2  | 2026-09-25 | TS5                                               |
| [Psalm — error levels](https://psalm.dev/docs/running_psalm/error_levels/)                                 | 6.18.0  | 2026-09-25 | TS3, TS4 — levels 1 (strictest) to 8              |
| [PHP-CS-Fixer — `declare_strict_types`](https://cs.symfony.com/doc/rules/strict/declare_strict_types.html) | 3.95.27 | 2026-09-25 | TS2 — also applied by Laravel Pint 1.32.1         |

## Laravel

| Reference                                                                            | Version                                            | Checked    | Used for                                                                                                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Laravel — release notes and support policy](https://laravel.com/docs/13.x/releases) | 13.33.0; PHP 8.3–8.5; security fixes to 2028-03-17 | 2026-09-25 | SKILL.md §1 decision 1                                                                                                    |
| [Laravel — configuration](https://laravel.com/docs/13.x/configuration)               | 13.x                                               | 2026-09-25 | SKILL.md §5; LE1, LE2 — `env()` only in config files once `config:cache` runs                                             |
| [Laravel — Eloquent](https://laravel.com/docs/13.x/eloquent)                         | 13.x                                               | 2026-09-25 | LE3, LE4 (strictness), LE5 (mass assignment, `#[Unguarded]`)                                                              |
| [Laravel — validation](https://laravel.com/docs/13.x/validation)                     | 13.x                                               | 2026-09-25 | LE7 — form requests                                                                                                       |
| [Laravel — service container](https://laravel.com/docs/13.x/container)               | 13.x                                               | 2026-09-25 | LE8                                                                                                                       |
| [Laravel — queues](https://laravel.com/docs/13.x/queues)                             | 13.x                                               | 2026-09-25 | SKILL.md §6; QB1–QB7 — `SerializesModels`, `after_commit`, `retry_after` vs timeout, unique jobs, failed jobs, encryption |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-25 | SKILL.md §1; Alternatives is this catalog's addition |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-25 | SKILL.md §8 — Context and Container only             |

## Deferred to elsewhere

- Authentication, authorization, CSRF, secrets and dependency vulnerabilities
  beyond `composer audit`: [`docs/review-standards.md`](../../docs/review-standards.md)
  and [`security-reviewer`](../security-reviewer/SKILL.md).
- Schema design, migrations and query plans:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- Images, PHP-FPM, CI and supply chain: the SLSA and NIST SSDF rows in
  `docs/review-standards.md`, and [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
