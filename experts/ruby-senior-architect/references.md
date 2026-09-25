# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. Gem versions were read from RubyGems, the Ruby line from
ruby-lang.org and the Rails line from rubyonrails.org on the date shown.
**Re-check every 90 days**, and at three known dates: Rails 8.1 leaves
bug-fix support on 2026-10-10, Rails 8.0 leaves security support on
2026-11-07, and a new Ruby minor is normally released on 25 December.

> **Next re-check due: 2026-12-24.**

## Language and platform

| Reference                                                                                                                             | Version                                                                                               | Checked    | Used for                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| [Ruby maintenance branches](https://www.ruby-lang.org/en/downloads/branches/)                                                         | 4.0.7 and 3.4.11 normal maintenance; 3.3 security only, expected end 2027-03-31; 3.2 ended 2026-04-01 | 2026-09-25 | SKILL.md §1 decision 1; BD7                                                              |
| [Rails maintenance policy](https://rubyonrails.org/maintenance)                                                                       | 8.1.4; 8.1 bug fixes to 2026-10-10, security to 2027-10-10; 8.0 security to 2026-11-07                | 2026-09-25 | SKILL.md §1 decision 1                                                                   |
| [Rails — autoloading and reloading constants](https://guides.rubyonrails.org/autoloading_and_reloading_constants.html)                | Rails 8.1; Zeitwerk 2.8.3                                                                             | 2026-09-25 | SKILL.md §4; ZL1, ZL3–ZL6; PB7                                                           |
| [Rails application generator templates](https://github.com/rails/rails/tree/v8.1.4/railties/lib/rails/generators/rails/app/templates) | v8.1.4                                                                                                | 2026-09-25 | ZL2 (`eager_load` in CI); BD8, BD9 (`bin/brakeman`, `bin/bundler-audit`, `config/ci.rb`) |
| [Rails — getting started with engines](https://guides.rubyonrails.org/engines.html)                                                   | Rails 8.1                                                                                             | 2026-09-25 | PB1                                                                                      |

## Bundler and security tooling

| Reference                                                                  | Version | Checked    | Used for                                                                                        |
| -------------------------------------------------------------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| [Bundler — `bundle install`](https://bundler.io/man/bundle-install.1.html) | 4.0.21  | 2026-09-25 | BD1                                                                                             |
| [Bundler — `bundle config`](https://bundler.io/man/bundle-config.1.html)   | 4.0.21  | 2026-09-25 | BD2, BD3 (`lockfile_checksums` defaults to true; `disable_checksum_validation`), BD5 (`frozen`) |
| [Bundler — `bundle lock`](https://bundler.io/man/bundle-lock.1.html)       | 4.0.21  | 2026-09-25 | BD2 (`--add-checksums`), BD4 (`--add-platform`)                                                 |
| [Bundler — Gemfile](https://bundler.io/man/gemfile.5.html)                 | 4.0.21  | 2026-09-25 | BD6 — `ruby file: ".ruby-version"`                                                              |
| [bundler-audit](https://github.com/rubysec/bundler-audit)                  | 0.9.3   | 2026-09-25 | SKILL.md §2; BD8                                                                                |
| [Brakeman](https://brakemanscanner.org/docs/options/)                      | 8.0.6   | 2026-09-25 | SKILL.md §2; BD9 — `--exit-on-warn`, `--exit-on-error`                                          |

## Boundaries

| Reference                                                                  | Version | Checked    | Used for                                                                         |
| -------------------------------------------------------------------------- | ------- | ---------- | -------------------------------------------------------------------------------- |
| [Packwerk — usage](https://github.com/Shopify/packwerk/blob/main/USAGE.md) | 3.3.1   | 2026-09-25 | SKILL.md §3; PB1–PB5 — `validate`, `check`, strict mode, `package_todo.yml`; AR4 |
| [packwerk-extensions](https://github.com/rubyatscale/packwerk-extensions)  | 0.3.0   | 2026-09-25 | PB6 — privacy checker, extracted from Packwerk                                   |
| [packs-rails](https://github.com/rubyatscale/packs-rails)                  | 0.1.0   | 2026-09-25 | PB7 — pack autoload paths                                                        |

## Active Record

| Reference                                                                                      | Version   | Checked    | Used for                                                                          |
| ---------------------------------------------------------------------------------------------- | --------- | ---------- | --------------------------------------------------------------------------------- |
| [Rails — Active Record callbacks](https://guides.rubyonrails.org/active_record_callbacks.html) | Rails 8.1 | 2026-09-25 | SKILL.md §5; AR1, AR2 — side effects, `after_commit`                              |
| [Rails — Active Job basics](https://guides.rubyonrails.org/active_job_basics.html)             | Rails 8.1 | 2026-09-25 | SKILL.md §5; AR3 — `enqueue_after_transaction_commit`                             |
| [ActiveSupport::Concern API](https://api.rubyonrails.org/classes/ActiveSupport/Concern.html)   | Rails 8.1 | 2026-09-25 | AR6                                                                               |
| [RuboCop Rails — cops](https://docs.rubocop.org/rubocop-rails/cops_rails.html)                 | 2.38.0    | 2026-09-25 | AR5 `Rails/DefaultScope` (disabled by default); AR7 `Rails/SkipsModelValidations` |

## Typing

| Reference                                                                                         | Version   | Checked    | Used for                              |
| ------------------------------------------------------------------------------------------------- | --------- | ---------- | ------------------------------------- |
| [Sorbet — strictness levels](https://sorbet.org/docs/static)                                      | 0.6.13506 | 2026-09-25 | SKILL.md §6; TD1–TD3                  |
| [Sorbet — adopting Sorbet](https://sorbet.org/docs/adopting)                                      | 0.6.13506 | 2026-09-25 | TD4                                   |
| [Sorbet — `T.untyped` and escape hatches](https://sorbet.org/docs/troubleshooting#escape-hatches) | 0.6.13506 | 2026-09-25 | TD6                                   |
| [Tapioca](https://github.com/Shopify/tapioca)                                                     | 0.20.0    | 2026-09-25 | TD5 — `tapioca gems --verify`         |
| [RBS](https://github.com/ruby/rbs)                                                                | 4.2.0     | 2026-09-25 | TD1, TD7                              |
| [Steep](https://github.com/soutaro/steep)                                                         | 2.1.0     | 2026-09-25 | TD1, TD7 — `steep check`, `Steepfile` |

## Architecture

| Reference                                                                                                                  | Version          | Checked    | Used for                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------- |
| [Architecture decision records — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | original, 2011   | 2026-09-25 | SKILL.md §1; Alternatives is this catalog's addition |
| [C4 model](https://c4model.com/)                                                                                           | current at check | 2026-09-25 | SKILL.md §8 — Context and Container only             |

## Deferred to elsewhere

- Authentication, authorization, CSRF, secrets and the fixes for Brakeman
  findings: [`docs/review-standards.md`](../../docs/review-standards.md) and
  [`security-reviewer`](../security-reviewer/SKILL.md).
- Schema design, migrations and query plans:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- Images, Kamal, CI and supply chain: the SLSA and NIST SSDF rows in
  `docs/review-standards.md`, and [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
