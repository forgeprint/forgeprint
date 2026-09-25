# Laravel edges

Laravel makes everything reachable from everywhere: `env()`, facades,
`request()`, a model from a Blade view. The architecture decides where each is
allowed, and the checks below are the greps that prove it.

| #   | Check                                                                             | How                                                                                     | Source                                 |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| LE1 | `env()` is called only inside `config/`                                           | `grep -rn "env(" --include=*.php app src routes resources` returns nothing              | Laravel 13 — configuration caching     |
| LE2 | Deploy runs `php artisan config:cache`, so LE1 violations surface before release  | read the deploy script                                                                  | Laravel 13 — configuration caching     |
| LE3 | Lazy loading throws outside production                                            | `Model::preventLazyLoading(! $this->app->isProduction())` in `AppServiceProvider::boot` | Laravel 13 — Eloquent strictness       |
| LE4 | Silently discarded attributes throw outside production                            | `Model::preventSilentlyDiscardingAttributes(...)` in the same place                     | Laravel 13 — Eloquent strictness       |
| LE5 | No model is unguarded                                                             | `grep -rn "Unguarded\|unguard(" app src` returns nothing                                | Laravel 13 — mass assignment           |
| LE6 | No facade, `request()`, `auth()` or model in the domain namespace                 | the LR3 layer rule; or `grep -rn "Illuminate\\\\" src/Domain`                           | Deptrac 4.7; Pest 5 — arch tests       |
| LE7 | Controllers validate through a Form Request and delegate to one action or service | read each controller; `$request->validate` inside a controller method is a finding      | Laravel 13 — validation: form requests |
| LE8 | Container bindings for the domain's interfaces live in one service provider       | `grep -rn "->bind(\|->singleton(" app/Providers`                                        | Laravel 13 — service container         |

## Why each one

**LE1** is the Laravel defect that passes every test. Locally `.env` is read
on every request and `env('PAYMENT_KEY')` works anywhere. After
`config:cache` in production the file is no longer loaded, and the same call
returns `null` — Laravel's own documentation says so. LE2 makes the failure
happen in the deploy rather than in the first payment.

**LE3** because a lazy load inside a loop is an N+1 query that looks like a
property access. Throwing in development and CI finds it while the loop is
still small; the production switch keeps a missed one from becoming an outage.

**LE6** is what "Laravel at the edge" means in a grep. If the ADR chose the
Laravel way throughout, this row does not apply — and the ADR says so.
