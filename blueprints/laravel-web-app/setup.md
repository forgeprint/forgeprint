# Setup

Creates a Laravel 13 web application on SQLite, with login and registration
through Laravel Fortify, a dashboard only a signed-in user can reach, Blade
views styled with Tailwind and built by Vite, feature tests that prove a guest
is sent to the login page, and a CI workflow.

Run every step from an empty directory that will hold the project. Each step
is one action and ends with the command that proves it worked. Stop at the
first verification that fails.

Requires PHP 8.3 or newer with the `pdo_sqlite`, `mbstring` and `openssl`
extensions, Composer 2, and Node.js 22.12 or newer. No database server: SQLite
is a file in the project.

1. Create the application from the pinned skeleton. Composer's own scripts are skipped so that everything they would do happens in a step below, where it can be seen: `composer create-project laravel/laravel:13.10.1 . --no-interaction --no-scripts`
   Verify: `php artisan --version`

2. Pin the framework itself. The skeleton only asks for `^13.17`, so without this step two runs a month apart build on different frameworks: `composer require laravel/framework:13.33.0 --no-interaction --with-all-dependencies`
   Verify: `php artisan --version | grep -q "13.33.0"`

3. Add Fortify, which provides the login, registration and logout endpoints: `composer require laravel/fortify:1.40.0 --no-interaction`
   Verify: `composer show laravel/fortify | grep -q "1.40.0"`

4. Stop if any installed package has a published security advisory: `composer audit --no-interaction`
   Verify: `test -f composer.lock`

5. Create the local environment file from the committed example. `.env` is git-ignored by the skeleton and stays that way: `cp .env.example .env`
   Verify: `grep -q "^DB_CONNECTION=sqlite" .env`

6. Generate this installation's encryption key. It is written into `.env` only, and every environment generates its own: `php artisan key:generate --no-interaction`
   Verify: `grep -q "^APP_KEY=base64:" .env`

7. Create the SQLite database file. `database/.gitignore` already keeps it out of version control: `touch database/database.sqlite`
   Verify: `test -f database/database.sqlite`

8. Create `config/fortify.php` with:

   ```php
   <?php

   use Laravel\Fortify\Features;

   /*
    * Fortify's own defaults turn on every feature it has: password reset,
    * email verification, two-factor authentication and passkeys. Each of
    * those needs views, mail or a migration this project does not have, so
    * this file lists what is actually built and nothing else. Adding a
    * feature here without its views leaves a route that answers with an
    * error page.
    */
   return [
       'guard' => 'web',
       'passwords' => 'users',
       'username' => 'email',
       'email' => 'email',
       'lowercase_usernames' => true,
       'home' => '/dashboard',
       'prefix' => '',
       'domain' => null,
       'middleware' => ['web'],
       'limiters' => [
           'login' => 'login',
       ],
       'views' => true,
       'features' => [
           Features::registration(),
       ],
   ];
   ```

   Verify: `php -l config/fortify.php`

9. Create `app/Actions/Fortify/CreateNewUser.php` with:

   ```php
   <?php

   namespace App\Actions\Fortify;

   use App\Models\User;
   use Illuminate\Support\Facades\Hash;
   use Illuminate\Support\Facades\Validator;
   use Illuminate\Validation\Rule;
   use Illuminate\Validation\Rules\Password;
   use Laravel\Fortify\Contracts\CreatesNewUsers;

   class CreateNewUser implements CreatesNewUsers
   {
       /**
        * Validate and create a newly registered user.
        *
        * Only these three fields are read. Anything else in the request is
        * ignored here, which is the point of naming them: a form that grows an
        * "is_admin" field does not grow an admin.
        *
        * @param  array<string, string>  $input
        */
       public function create(array $input): User
       {
           Validator::make($input, [
               'name' => ['required', 'string', 'max:255'],
               'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
               // The rule itself is defined once, in AppServiceProvider, so a
               // password change or reset added later cannot drift from it.
               'password' => ['required', 'string', Password::default(), 'confirmed'],
           ])->validate();

           return User::create([
               'name' => $input['name'],
               'email' => $input['email'],
               'password' => Hash::make($input['password']),
           ]);
       }
   }
   ```

   Verify: `php -l app/Actions/Fortify/CreateNewUser.php`

10. Replace `app/Providers/AppServiceProvider.php` with:

    ```php
    <?php

    namespace App\Providers;

    use Illuminate\Support\ServiceProvider;
    use Illuminate\Validation\Rules\Password;

    class AppServiceProvider extends ServiceProvider
    {
        public function boot(): void
        {
            // Twelve characters everywhere. In production, also refuse a
            // password that appears in a public breach corpus: the check sends
            // the first five characters of the password's SHA-1 hash to the
            // Have I Been Pwned range API and never the password itself. It is
            // production-only so that tests and local work never leave the
            // machine, and if the service cannot be reached the framework lets
            // the password through rather than blocking registration.
            Password::defaults(function () {
                $rule = Password::min(12);

                return $this->app->isProduction() ? $rule->uncompromised() : $rule;
            });
        }
    }
    ```

    Verify: `php -l app/Providers/AppServiceProvider.php`

11. Create `app/Providers/FortifyServiceProvider.php` with:

    ```php
    <?php

    namespace App\Providers;

    use App\Actions\Fortify\CreateNewUser;
    use Illuminate\Cache\RateLimiting\Limit;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\RateLimiter;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\Support\Str;
    use Laravel\Fortify\Fortify;

    class FortifyServiceProvider extends ServiceProvider
    {
        public function boot(): void
        {
            Fortify::createUsersUsing(CreateNewUser::class);

            Fortify::loginView(fn () => view('auth.login'));
            Fortify::registerView(fn () => view('auth.register'));

            // Two limits on the login endpoint. Five attempts a minute for one
            // account from one address stops guessing a password; twenty a
            // minute from one address, whatever the account, stops trying one
            // password against many accounts. The login route applies this by
            // name through `limiters.login` in config/fortify.php.
            RateLimiter::for('login', function (Request $request) {
                $account = Str::transliterate(Str::lower((string) $request->input(Fortify::username())));

                return [
                    Limit::perMinute(5)->by($account.'|'.$request->ip()),
                    Limit::perMinute(20)->by($request->ip()),
                ];
            });
        }
    }
    ```

    Verify: `php -l app/Providers/FortifyServiceProvider.php`

12. Replace `bootstrap/providers.php` with:

    ```php
    <?php

    use App\Providers\AppServiceProvider;
    use App\Providers\FortifyServiceProvider;

    return [
        AppServiceProvider::class,
        FortifyServiceProvider::class,
    ];
    ```

    Verify: `php artisan route:list --path=register | grep -q "register"`

13. Create `resources/views/layouts/app.blade.php` with:

    ```blade
    <!DOCTYPE html>
    <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>@yield('title', config('app.name'))</title>
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        </head>
        <body class="min-h-screen bg-white text-gray-900 antialiased">
            <main class="mx-auto max-w-md p-8">
                @yield('content')
            </main>
        </body>
    </html>
    ```

    Verify: `test -f resources/views/layouts/app.blade.php`

14. Replace `resources/views/welcome.blade.php` with:

    ```blade
    @extends('layouts.app')

    @section('content')
        <h1 class="text-2xl font-semibold">{{ config('app.name') }}</h1>

        @auth
            <p class="mt-4"><a href="{{ route('dashboard') }}" class="underline">Go to the dashboard</a></p>
        @else
            <p class="mt-4">
                <a href="{{ route('login') }}" class="underline">Log in</a>
                or
                <a href="{{ route('register') }}" class="underline">register</a>.
            </p>
        @endauth
    @endsection
    ```

    Verify: `test -f resources/views/welcome.blade.php`

15. Create `resources/views/auth/login.blade.php` with:

    ```blade
    @extends('layouts.app')

    @section('title', 'Log in')

    @section('content')
        <h1 class="text-2xl font-semibold">Log in</h1>

        <form method="POST" action="{{ route('login') }}" class="mt-6 space-y-4">
            @csrf

            <div>
                <label for="email" class="block text-sm font-medium">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus autocomplete="username" class="mt-1 w-full rounded border px-3 py-2">
                @error('email')
                    <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="password" class="block text-sm font-medium">Password</label>
                <input id="password" name="password" type="password" required autocomplete="current-password" class="mt-1 w-full rounded border px-3 py-2">
                @error('password')
                    <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                @enderror
            </div>

            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remember">
                Remember me
            </label>

            <button type="submit" class="rounded bg-gray-900 px-4 py-2 text-white">Log in</button>
        </form>

        <p class="mt-6 text-sm">No account yet? <a href="{{ route('register') }}" class="underline">Register</a></p>
    @endsection
    ```

    Verify: `test -f resources/views/auth/login.blade.php`

16. Create `resources/views/auth/register.blade.php` with:

    ```blade
    @extends('layouts.app')

    @section('title', 'Register')

    @section('content')
        <h1 class="text-2xl font-semibold">Register</h1>

        <form method="POST" action="{{ route('register') }}" class="mt-6 space-y-4">
            @csrf

            <div>
                <label for="name" class="block text-sm font-medium">Name</label>
                <input id="name" name="name" type="text" value="{{ old('name') }}" required autofocus autocomplete="name" class="mt-1 w-full rounded border px-3 py-2">
                @error('name')
                    <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="email" class="block text-sm font-medium">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" required autocomplete="username" class="mt-1 w-full rounded border px-3 py-2">
                @error('email')
                    <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="password" class="block text-sm font-medium">Password (at least 12 characters)</label>
                <input id="password" name="password" type="password" required autocomplete="new-password" class="mt-1 w-full rounded border px-3 py-2">
                @error('password')
                    <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="password_confirmation" class="block text-sm font-medium">Confirm password</label>
                <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" class="mt-1 w-full rounded border px-3 py-2">
            </div>

            <button type="submit" class="rounded bg-gray-900 px-4 py-2 text-white">Register</button>
        </form>

        <p class="mt-6 text-sm">Already registered? <a href="{{ route('login') }}" class="underline">Log in</a></p>
    @endsection
    ```

    Verify: `test -f resources/views/auth/register.blade.php`

17. Create `resources/views/dashboard.blade.php` with:

    ```blade
    @extends('layouts.app')

    @section('title', 'Dashboard')

    @section('content')
        <h1 class="text-2xl font-semibold">Dashboard</h1>

        <p class="mt-4">Signed in as {{ auth()->user()->name }}.</p>

        <form method="POST" action="{{ route('logout') }}" class="mt-6">
            @csrf
            <button type="submit" class="rounded border px-4 py-2">Log out</button>
        </form>
    @endsection
    ```

    Verify: `test -f resources/views/dashboard.blade.php`

18. Replace `routes/web.php` with:

    ```php
    <?php

    use Illuminate\Support\Facades\Route;

    Route::view('/', 'welcome')->name('home');

    // Everything a signed-in user sees goes inside this group. A route added
    // outside it is public, and nothing will say so.
    Route::middleware('auth')->group(function () {
        Route::view('/dashboard', 'dashboard')->name('dashboard');
    });
    ```

    Verify: `php artisan route:list --path=dashboard -v | grep -qi "auth"`

19. Replace `tests/TestCase.php` with:

    ```php
    <?php

    namespace Tests;

    use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

    abstract class TestCase extends BaseTestCase
    {
        protected function setUp(): void
        {
            parent::setUp();

            // The layout calls @vite, which needs a built manifest. Tests
            // exercise routes and views, not the asset build, so they must not
            // fail on a machine that has not run `npm run build`.
            $this->withoutVite();
        }
    }
    ```

    Verify: `php -l tests/TestCase.php`

20. Create `tests/Feature/DashboardTest.php` with:

    ```php
    <?php

    namespace Tests\Feature;

    use App\Models\User;
    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Tests\TestCase;

    class DashboardTest extends TestCase
    {
        use RefreshDatabase;

        public function test_guests_are_redirected_to_the_login_page(): void
        {
            $this->get('/dashboard')->assertRedirect(route('login'));
        }

        public function test_signed_in_users_can_see_the_dashboard(): void
        {
            $user = User::factory()->create();

            $this->actingAs($user)->get('/dashboard')->assertOk()->assertSee($user->name);
        }
    }
    ```

    Verify: `php -l tests/Feature/DashboardTest.php`

21. Create `tests/Feature/AuthenticationTest.php` with:

    ```php
    <?php

    namespace Tests\Feature;

    use App\Models\User;
    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Tests\TestCase;

    class AuthenticationTest extends TestCase
    {
        use RefreshDatabase;

        public function test_the_login_page_renders(): void
        {
            $this->get('/login')->assertOk();
        }

        public function test_users_can_log_in_with_the_right_password(): void
        {
            $user = User::factory()->create();

            $this->post('/login', ['email' => $user->email, 'password' => 'password'])
                ->assertRedirect('/dashboard');

            $this->assertAuthenticatedAs($user);
        }

        public function test_users_cannot_log_in_with_a_wrong_password(): void
        {
            $user = User::factory()->create();

            $this->post('/login', ['email' => $user->email, 'password' => 'not-the-password'])
                ->assertSessionHasErrors('email');

            $this->assertGuest();
        }

        public function test_login_attempts_are_rate_limited(): void
        {
            $user = User::factory()->create();

            for ($attempt = 1; $attempt <= 5; $attempt++) {
                $this->post('/login', ['email' => $user->email, 'password' => 'not-the-password']);
            }

            // The sixth attempt is refused before the password is checked, so
            // even the right one does not get through.
            $this->post('/login', ['email' => $user->email, 'password' => 'password'])
                ->assertStatus(429);

            $this->assertGuest();
        }

        public function test_users_can_log_out(): void
        {
            $user = User::factory()->create();

            $this->actingAs($user)->post('/logout')->assertRedirect('/');

            $this->assertGuest();
        }
    }
    ```

    Verify: `php -l tests/Feature/AuthenticationTest.php`

22. Create `tests/Feature/RegistrationTest.php` with:

    ```php
    <?php

    namespace Tests\Feature;

    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Tests\TestCase;

    class RegistrationTest extends TestCase
    {
        use RefreshDatabase;

        public function test_the_registration_page_renders(): void
        {
            $this->get('/register')->assertOk();
        }

        public function test_new_users_can_register(): void
        {
            $this->post('/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'correct-horse-battery',
                'password_confirmation' => 'correct-horse-battery',
            ])->assertRedirect('/dashboard');

            $this->assertAuthenticated();
            $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        }

        public function test_a_short_password_is_refused(): void
        {
            $this->post('/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'too-short',
                'password_confirmation' => 'too-short',
            ])->assertSessionHasErrors('password');

            $this->assertGuest();
            $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
        }
    }
    ```

    Verify: `php -l tests/Feature/RegistrationTest.php`

23. Replace `vite.config.js` with a configuration that builds from the project alone. The skeleton's version downloads a web font from a font service during the build, and a build that needs a third-party host is a build that fails offline:

    ```javascript
    import { defineConfig } from 'vite';
    import laravel from 'laravel-vite-plugin';
    import tailwindcss from '@tailwindcss/vite';

    export default defineConfig({
      plugins: [
        laravel({
          input: ['resources/css/app.css', 'resources/js/app.js'],
          refresh: true,
        }),
        tailwindcss(),
      ],
      server: {
        watch: {
          ignored: ['**/storage/framework/views/**'],
        },
      },
    });
    ```

    Verify: `test -f vite.config.js`

24. Replace `resources/css/app.css` with:

    ```css
    @import 'tailwindcss';

    @source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
    @source '../../storage/framework/views/*.php';
    ```

    Verify: `test -f resources/css/app.css`

25. Replace `package.json` with exact versions in place of the skeleton's ranges:

    ```json
    {
      "private": true,
      "type": "module",
      "scripts": {
        "build": "vite build",
        "dev": "vite"
      },
      "devDependencies": {
        "@tailwindcss/vite": "4.3.3",
        "concurrently": "10.0.5",
        "laravel-vite-plugin": "3.2.0",
        "tailwindcss": "4.3.3",
        "vite": "8.3.1"
      },
      "optionalDependencies": {
        "@laravel/multiplex": "0.4.4"
      }
    }
    ```

    Verify: `test -f package.json`

26. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: shivammathur/setup-php@f3e473d116dcccaddc5834248c87452386958240 # 2.37.2
            with:
              php-version: '8.5'
              tools: composer:v2
              coverage: none
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: composer install --no-interaction --prefer-dist
          - run: composer audit --no-interaction
          - run: npm ci --no-audit --no-fund
          - run: npm run build
          - run: cp .env.example .env
          - run: php artisan key:generate --no-interaction
          - run: vendor/bin/pint --test
          - run: php artisan test
    ```

    Verify: `test -f .github/workflows/ci.yml`

27. Replace `README.md` with:

    ```markdown
    # app

    A Laravel web application on SQLite, with login and registration through
    Fortify and a frontend built by Vite.

    ## Run it

    1. `composer install` and `npm install`
    2. `cp .env.example .env` and `php artisan key:generate` — the key is
       generated per environment and never committed.
    3. `touch database/database.sqlite` and `php artisan migrate`
    4. `npm run build`, then `php artisan serve`

    ## Test it

    `php artisan test`. Tests run on an in-memory SQLite database and do not
    need a built frontend.

    See `AGENTS.md` before adding a page or a table.
    ```

    Verify: `test -f README.md`

28. Install the pinned frontend packages: `npm install --no-audit --no-fund`
    Verify: `test -d node_modules/laravel-vite-plugin`

29. Build the frontend: `npm run build`
    Verify: `grep -q "resources/css/app.css" public/build/manifest.json`

30. Apply the migrations to the local database: `php artisan migrate --no-interaction`
    Verify: `php artisan migrate:status --no-interaction | grep -q "create_users_table.*Ran"`

31. Format the PHP code with the project's formatter, which CI checks: `vendor/bin/pint`
    Verify: `vendor/bin/pint --test`

32. Run the tests, which prove that a guest is sent to the login page, that login, registration and logout work, and that the sixth login attempt in a minute is refused: `php artisan test`
    Verify: `php artisan test --filter=test_guests_are_redirected_to_the_login_page`

33. Cache the configuration the way a production deploy does. Once it is cached, `env()` returns nothing outside `config/`, so the check also proves nothing else reads the environment directly: `php artisan config:cache`
    Verify: `test -f bootstrap/cache/config.php && ! grep -rIEn "(^|[^_a-zA-Z>])env\(" app routes resources database`

34. Cache the routes, which fails if any route cannot be serialised: `php artisan route:cache`
    Verify: `php artisan route:list --path=dashboard | grep -q "dashboard"`

35. Clear both caches, because a cached configuration makes the test runner ignore `phpunit.xml` and point the tests at the real database: `php artisan optimize:clear`
    Verify: `test ! -f bootstrap/cache/config.php`
