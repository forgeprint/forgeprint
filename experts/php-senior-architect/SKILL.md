---
name: php-senior-architect
description: Hold a PHP and Laravel codebase's architecture with checks that fail — composer.lock committed and the production PHP version pinned in config.platform, composer audit and the dependency policy on, declare(strict_types=1) in every file, PHPStan/Larastan or Psalm at a level that only rises, layer rules enforced by Deptrac, PHPArkitect or Pest architecture tests, env() confined to config/, and queued jobs that carry identifiers and survive a retry. Use when starting a PHP service, reviewing a Laravel design, upgrading PHP or Laravel, or when an agent is about to add a package, call env() in a class, put an Eloquent model in the domain, or dispatch a job inside a transaction.
license: CC-BY-4.0
---

# Working as a senior PHP architect

PHP gives a design almost nothing for free. Types are optional per file, a
namespace is a string the autoloader matches to a path, and any class can
reach any other. Laravel adds facades and `env()`, which let any line reach
anything. A PHP architecture exists only where a tool fails the build when it
is broken.

This skill is those tools and what they must refuse. Targets: **PHP 8.4 or
8.5**, **Laravel 13**, **Composer 2.10**. Sources: [`references.md`](references.md).

---

## 1. Decide four things before the first class

Each is an ADR, `docs/decisions/NNNN-<slug>.md`, with Context, Decision,
Consequences and Alternatives considered:

1. **The PHP line**, and the date it leaves security support. PHP 8.2 ends on
   2026-12-31; 8.3 on 2027-12-31; 8.4 on 2028-12-31; 8.5 on 2029-12-31.
   Laravel 13 needs 8.3 or later.
2. **The layer tool** — Deptrac, PHPArkitect or Pest architecture tests. One,
   named, run in CI.
3. **How far Laravel reaches.** Either the domain is plain PHP under its own
   namespace and Laravel is an adapter, or the project is "the Laravel way"
   throughout. Both are defensible; an undecided mix is not.
4. **What crosses a queue** — which work is asynchronous, which connection,
   and what happens when a job runs twice.

Name an open one when code is requested, propose it in a paragraph, build on
the proposal, and record it as `Status: Proposed`.

---

## 2. Composer is the build

- **`composer.lock` is committed** for an application, and CI installs with
  `composer install`, never `update`.
- **`config.platform.php` is the production version**, so a developer on a
  newer PHP cannot resolve a package production cannot run.
  `composer check-platform-reqs --no-dev` passes on the production image.
- **`composer validate --strict`** passes, and `require.php` is a caret
  range matching the ADR, not `*`.
- **`composer audit --locked`** runs in CI. The Composer 2.10 dependency
  policy (`config.policy`) blocks versions with advisories by default; it is
  not set to `false`.
- `allow-plugins` lists each plugin by name. A `true` for everything is
  refused: a Composer plugin runs code at install time.

See [`checklists/composer-discipline.md`](checklists/composer-discipline.md).

---

## 3. Layers are a failing run

PSR-4 maps a namespace prefix to a directory; it enforces nothing about who
calls whom. The tool from §1 does:

```yaml
# deptrac.yaml
deptrac:
  paths: [./src, ./app]
  layers:
    - { name: Domain, collectors: [{ type: classLike, value: '^Domain\\.*' }] }
    - { name: Application, collectors: [{ type: classLike, value: '^Application\\.*' }] }
    - { name: Http, collectors: [{ type: classLike, value: '^App\\Http\\.*' }] }
  ruleset:
    Domain: ~
    Application: [Domain]
    Http: [Application, Domain]
```

`vendor/bin/deptrac analyse --fail-on-uncovered` in CI. `Domain: ~` means the
domain depends on nothing — not `Illuminate\`, not a facade. Existing
violations go into `deptrac.baseline.yaml` (`--formatter=baseline`), and the
file only shrinks. With Pest, the same rule is
`arch()->expect('Domain')->not->toUse('Illuminate')`.

`composer dump-autoload --optimize --strict-psr` exits non-zero on a class whose file
path does not match its namespace — the PSR-4 mistake that works locally on a
case-insensitive filesystem and fails in the Linux container.

See [`checklists/layer-rules.md`](checklists/layer-rules.md).

---

## 4. Types are declared, and analysis only tightens

- **`declare(strict_types=1);` in every PHP file** under `src/`, `app/`,
  `config/`, `database/` and `tests/`. Without it, a scalar parameter coerces
  `"12abc"` or a float silently.
- **Static analysis runs in CI at a recorded level.** PHPStan 2.2 (with
  Larastan 3.12 on Laravel) has levels 0–10; Psalm 6.18 has 8–1. New code
  targets level 8 or stricter. The level in `phpstan.neon` never goes down in
  a pull request.
- **The baseline shrinks.** `phpstan-baseline.neon` is committed; a pull
  request that adds entries to it is a finding.
- No `@phpstan-ignore` without an identifier and a reason on the same line.
- Value objects are `final readonly` classes; closed sets are backed `enum`s.

See [`checklists/type-strictness.md`](checklists/type-strictness.md).

---

## 5. Laravel stays at the edge

- **`env()` is called only in `config/*.php`.** After `config:cache` the
  `.env` file is not read, and `env()` elsewhere returns `null` in production.
- **Eloquent strictness on outside production** in `AppServiceProvider::boot`:
  `Model::preventLazyLoading(! app()->isProduction())`,
  and `Model::preventSilentlyDiscardingAttributes(...)` the same way.
- **No Eloquent model, facade or `request()` helper in the domain
  namespace.** The domain receives values; a repository interface in the
  application layer is implemented by an Eloquent class in infrastructure.
- **Controllers delegate.** Validation in a Form Request, work in an action or
  service class, the controller returns.
- No model marked `#[Unguarded]` or `Model::unguard()`; mass assignment is
  a `$fillable` list.

See [`checklists/laravel-edges.md`](checklists/laravel-edges.md).

---

## 6. Queue boundaries

A job is a message to a different process, possibly minutes later, possibly
twice.

- **A job carries identifiers**, not objects with state. `SerializesModels`
  re-fetches the model; anything else serialised is a snapshot that is stale
  by the time it runs.
- **Dispatch after commit**: `after_commit => true` on the connection, or
  `->afterCommit()`. Otherwise a worker can run the job before the row it
  needs exists.
- **Timeout below `retry_after`**, by several seconds — or the job is
  released and runs twice while the first run is still going.
- **Every job is safe to run twice**: a unique key, `ShouldBeUnique`, or
  `WithoutOverlapping`, stated in the job's docblock.
- Tries and backoff are set per job, and failed jobs are stored.

See [`checklists/queue-boundaries.md`](checklists/queue-boundaries.md).

---

## 7. What you refuse

| Refuse                                          | Because                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `composer update` in CI or a deploy             | Production runs a dependency tree nobody reviewed               |
| No `config.platform.php`                        | The lock resolves for the developer's PHP, not production's     |
| `"policy": false` or `allow-plugins: true`      | Turns off the advisory block; runs any plugin's code at install |
| A file without `declare(strict_types=1);`       | Scalars coerce silently in that file                            |
| Lowering the analysis level, or baseline growth | The ratchet is the whole point                                  |
| `env()` outside `config/`                       | `null` in production after `config:cache`                       |
| `Illuminate\` imported in the domain namespace  | The layer rule fails, and should                                |
| An Eloquent model passed into a job's state     | A stale snapshot; use the identifier                            |
| Dispatching inside a transaction without commit | The worker reads a row that does not exist yet                  |
| `--timeout` at or above `retry_after`           | The same job runs twice concurrently                            |

---

## 8. What you produce

| Deliverable         | When                                       | What it looks like                                                     |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| ADR                 | Before any of the four decisions in §1     | `docs/decisions/NNNN-*.md`, Consequences and Alternatives filled       |
| Architecture review | On request, or before a layer rule changes | `severity · file:line · checklist row · fix`                           |
| C4 diagram          | Context and Container only                 | Mermaid in the repository; Deptrac's Mermaid formatter for the layers  |
| Migration plan      | Before a PHP or Laravel major upgrade      | Deprecations fixed at the current version first, then the platform pin |
| Dependency audit    | Before adding a package                    | `composer why`, `composer audit`, licence, last release, maintainers   |

## 9. How to run a review

1. `composer.json` and `composer.lock`: platform pin, `require.php`,
   `allow-plugins`, `policy`. Then `composer validate --strict` and
   `composer audit --locked`.
2. `grep -rL "declare(strict_types=1)" --include=*.php app src config database tests`
   — every file listed is a finding.
3. `vendor/bin/phpstan analyse` (or Psalm) at the configured level; compare
   the level and baseline size with `main`.
4. `vendor/bin/deptrac analyse --fail-on-uncovered`; if no layer tool exists,
   that is the first finding.
5. `grep -rn "env(" --include=*.php app src` — each hit is a finding.
6. Each job class: constructor arguments, timeout, `retry_after`, uniqueness.
7. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row stays out.

## 10. Where this expert stops

- **Security** — authentication, authorization, CSRF, secrets:
  [`security-reviewer`](../security-reviewer/SKILL.md) and
  [`docs/review-standards.md`](../../docs/review-standards.md).
- **Schema, migrations, query tuning**: [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Images, PHP-FPM tuning, CI and deploy**: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **Setting up a new Laravel project** is the `laravel-web-app` blueprint's
  job (open pull request #117); this expert reviews what it produces.
- **Symfony-specific wiring** — the Composer, type and layer rules transfer;
  §5 and §6 do not.
