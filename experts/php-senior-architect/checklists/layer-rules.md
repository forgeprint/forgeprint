# Layer rules

In PHP any class can `use` any other; PSR-4 only decides which file holds it.
A layer exists where a tool fails the build when the layer is crossed.

| #   | Check                                                                                        | How                                                                              | Source                                            |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| LR1 | One layer tool is chosen and recorded: Deptrac, PHPArkitect or Pest architecture tests       | the ADR; the package in `require-dev`                                            | Deptrac 4.7; PHPArkitect 1.3; Pest 5 — arch tests |
| LR2 | The tool runs in CI and fails the job                                                        | `vendor/bin/deptrac analyse`, `vendor/bin/phparkitect check`, or `pest --filter` | Deptrac 4.7 — README                              |
| LR3 | The domain layer depends on nothing: no `Illuminate\`, no `App\Models`                       | Deptrac `Domain: ~`; Pest `->not->toUse('Illuminate')`                           | Deptrac 4.7 — concepts; Pest 5 — arch tests       |
| LR4 | Uncovered classes fail the run rather than pass silently                                     | `--fail-on-uncovered` on the Deptrac command                                     | Deptrac 4.7 — `analyse` options                   |
| LR5 | Existing violations are in a baseline file, and the file does not grow                       | `deptrac.baseline.yaml` committed; `git diff main -- deptrac.baseline.yaml`      | Deptrac 4.7 — baseline formatter                  |
| LR6 | Every class's path matches its PSR-4 namespace                                               | `composer dump-autoload --optimize --strict-psr` exits 0                         | PSR-4; Composer 2.10 — CLI: `dump-autoload`       |
| LR7 | The domain has its own namespace root in `autoload.psr-4`, not a folder under `App\`         | read `composer.json` `autoload.psr-4`                                            | PSR-4                                             |
| LR8 | Controllers depend on the application layer, never on another controller or a model directly | a layer rule, or `toOnlyBeUsedIn` on `App\Models`                                | Pest 5 — arch tests: `toOnlyBeUsedIn`             |

## Why each one

**LR3** is the rule every other row protects. A domain class that imports a
facade or an Eloquent model cannot be constructed in a plain PHPUnit test, and
from then on the domain is tested only through HTTP — which means it is
tested less.

**LR4** because Deptrac by default reports on classes it can place in a layer
and says nothing about the rest. A new directory that no collector matches is
invisible to the rules until `--fail-on-uncovered` makes it an error.

**LR6** is the mistake a case-insensitive filesystem hides: `app/Services/userService.php`
declaring `UserService` loads on a developer's machine and fails with "class
not found" in the Linux container. `--strict-psr` finds it before the deploy.
