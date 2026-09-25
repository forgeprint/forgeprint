# Type strictness

PHP's type system is opt-in per file and its static analysis is opt-in per
level. The architecture decides both, once, and a pull request can only move
them in one direction.

| #   | Check                                                                         | How                                                                                            | Source                                            |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| TS1 | Every PHP file declares `strict_types=1`                                      | `grep -rL "declare(strict_types=1)" --include=*.php app src config database tests` prints none | PHP manual — type declarations: strict typing     |
| TS2 | The rule is enforced by a tool, not by review                                 | Pest `toUseStrictTypes()`, or the PHP-CS-Fixer / Pint `declare_strict_types` rule in CI        | Pest 5 — arch tests; PHP-CS-Fixer 3.95            |
| TS3 | Static analysis runs in CI at a recorded level                                | `phpstan.neon` `level:` or `psalm.xml` `errorLevel`; the CI step                               | PHPStan 2.2 — rule levels; Psalm 6.18             |
| TS4 | New code is analysed at PHPStan level 8 or stricter (Psalm 3 or stricter)     | read the configured level                                                                      | PHPStan 2.2 — rule levels                         |
| TS5 | On Laravel, PHPStan runs with Larastan so facades and Eloquent are understood | `larastan/larastan` in `require-dev`; its extension included in `phpstan.neon`                 | Larastan 3.12                                     |
| TS6 | The level never decreases and the baseline never grows in a pull request      | `git diff main -- phpstan.neon phpstan-baseline.neon`                                          | PHPStan 2.2 — the baseline                        |
| TS7 | Every inline ignore names the error identifier and a reason                   | `grep -rn "@phpstan-ignore" app src`; each has an identifier                                   | PHPStan 2.2 — ignoring errors                     |
| TS8 | Value objects are `final readonly`; closed sets are backed enums              | read the domain namespace for mutable DTOs and class constants used as enums                   | PHP manual — readonly classes (8.2); enumerations |

## Why each one

**TS1** because in coercive mode `function price(int $cents)` accepts
`"199"` and `19.99` — the second one truncated — and nothing says so. With
`strict_types=1` in the calling file, both are `TypeError`s at the line that
made the mistake.

**TS6** is the ratchet. A level set once and lowered "just for this pull
request" is how a codebase arrives at level 3 with a ten-thousand-line
baseline. Comparing against `main` is the only check that notices.

**TS4** because level 8 is where PHPStan starts reporting method calls and
property access on nullable types — the largest single class of PHP runtime
errors. Levels 9 and 10 then tighten `mixed`, and are worth it on a domain
layer that has no framework types in it.
