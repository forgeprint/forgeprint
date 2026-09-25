# Laravel Web App — agent context

A Laravel 13 application on SQLite, with login and registration through
Fortify, Blade views, and Tailwind built by Vite. Read this before adding a
page, a table or a form.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/Actions/Fortify/CreateNewUser.php   what registration accepts, and nothing else
app/Providers/AppServiceProvider.php     the password rule, for every form that sets one
app/Providers/FortifyServiceProvider.php views for Fortify, and the login rate limit
config/fortify.php                      which Fortify features are on (only registration)
routes/web.php                          public routes, then the `auth` group
resources/views/layouts/app.blade.php   the one layout; the only place @vite is called
resources/views/auth/                   login and register forms
database/migrations/                    the schema, in order; never edited after it runs
tests/Feature/                          HTTP-level tests on in-memory SQLite
```

There are no authentication controllers in `app/`. Fortify registers the
`/login`, `/register` and `/logout` routes from the vendor directory; this
project supplies the views, the user-creation action and the rate limiter.

## Rules that are not style preferences

**A route is public unless it is inside the `auth` group.** `routes/web.php`
has one group with `->middleware('auth')`. A page that shows anything about the
signed-in user goes inside it. A route added above it is reachable by anybody,
and nothing fails to tell you: `DashboardTest` only covers `/dashboard`. Add a
guest-redirect test for every protected page you add.

**Being signed in is not permission.** `auth` answers "who is this"; it does not
answer "may this user see that record". When a route takes an id —
`/projects/{project}` — authorize it with a policy (`php artisan make:policy`)
and `$this->authorize()` or `->can()` on the route, and write the test where a
second user asks for the first user's record and gets 403. Without that, every
signed-in user can read every row by changing a number in the URL.

**`env()` is called only inside `config/`.** Everywhere else reads
`config('...')`. After `php artisan config:cache` — which every production
deploy should run — `env()` returns `null` outside the config files, so code
that reads it directly works on a laptop and silently gets nothing in
production. The recipe greps for this; keep it true.

**`APP_KEY` is per environment and never committed.** It encrypts sessions and
cookies. `.env` is git-ignored; `.env.example` has an empty `APP_KEY=` and
stays that way. Generate one with `php artisan key:generate` in each
environment. Changing it logs everybody out and makes previously encrypted
values unreadable; to rotate, move the old key to `APP_PREVIOUS_KEYS`.

**`.env.example` describes a laptop, not a server.** `APP_DEBUG=true` renders
stack traces and configuration values into the error page, and the session
cookie is not marked `Secure` unless `SESSION_SECURE_COOKIE` says so. Any
environment another person can reach runs with `APP_ENV=production`,
`APP_DEBUG=false` and `SESSION_SECURE_COOKIE=true`, set in that environment
rather than in a committed file.

**Migrations are append-only.** Add a column with a new migration
(`php artisan make:migration add_x_to_y_table`), never by editing one that has
already run somewhere else — the other database will never see the edit.
`migrate:fresh` drops every table; it belongs in tests and nowhere near a
database with real data.

**Mass assignment is an allow-list.** `User` names its fillable fields with the
`#[Fillable]` attribute. Add a field there deliberately; never switch a model
to `$guarded = []`, and never pass `$request->all()` straight to `create()` —
`CreateNewUser` validates and copies three named fields, and that is the
pattern.

**Output goes through `{{ }}`.** It escapes. `{!! !!}` does not, and is never
used on anything a user typed. Every `POST`, `PUT` and `DELETE` form carries
`@csrf`; the `web` middleware rejects one without it with a 419.

**Fortify features and views come together.** `config/fortify.php` turns on
registration only, on purpose: Fortify's own defaults turn on password reset,
email verification, two-factor authentication and passkeys, each of which needs
views, mail or a migration this project does not have. Turning one on means
adding its views in `FortifyServiceProvider` (`Fortify::requestPasswordResetLinkView`,
and so on) and its tests in the same change.

**The password rule lives in one place.** `AppServiceProvider` sets
`Password::defaults()`: twelve characters, plus a breached-password check in
production only. Every form that sets a password validates with
`Password::default()`, never with its own `min:` rule, so a reset or change
form added later cannot be weaker than registration.

**Tests do not need a built frontend.** `tests/TestCase.php` calls
`withoutVite()`. Tests run on in-memory SQLite (`phpunit.xml`), so
`RefreshDatabase` is cheap; use it in every feature test that touches the
database.

**A cached configuration hijacks the tests.** With `bootstrap/cache/config.php`
present, the test runner ignores `phpunit.xml` and uses `.env` — the real
database. `composer test` clears it first; if you run `php artisan test`
after `config:cache`, run `php artisan optimize:clear` before it.

## Commands

```
composer install && npm install    dependencies
php artisan migrate                apply migrations to database/database.sqlite
npm run build                      build CSS and JS into public/build
php artisan serve                  run locally
php artisan test                   the test suite
vendor/bin/pint                    format PHP; CI runs `pint --test`
```

## Adding a protected page

1. Create the view under `resources/views/`, extending `layouts.app`.
2. Add the route **inside** the `auth` group in `routes/web.php`, with a name.
3. If the route takes a model id, add a policy and authorize it.
4. Add two tests: a guest is redirected to `route('login')`, and a signed-in
   user gets 200. If there is a policy, a third: another user gets 403.
5. `vendor/bin/pint` and `php artisan test`.

## Adding a table

1. `php artisan make:model Thing -mf` — model, migration and factory together.
2. Write the migration; give every foreign key `->constrained()` and decide
   `cascadeOnDelete()` or not on purpose.
3. Name the fillable fields on the model.
4. `php artisan migrate`, then a test that creates a row through the factory.

## What this does not do

No password change, no password reset, no email verification, no two-factor
authentication, no passkeys — Fortify supports all five and they are turned
off. No roles, no
policies, no admin area. No rate limit on registration. No queue worker, no
mail beyond the `log` mailer, no file uploads, no deployment configuration.
SQLite is the only database the recipe sets up; `config/database.php` already
knows MySQL and PostgreSQL, and switching is a `.env` change plus a server.
