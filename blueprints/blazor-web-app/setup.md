# Setup

Creates a Blazor Web App on .NET 10 with ASP.NET Core Identity on SQLite, pages
rendered on the server with Interactive Server where a component asks for it,
component tests in bUnit, tests that prove the protected page and the
antiforgery check, and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires the .NET SDK 10 and curl.

1. Pin the SDK so every machine builds with the same one: `dotnet new globaljson --sdk-version 10.0.100 --roll-forward latestFeature`
   Verify: `dotnet --version`

2. Add the .NET ignore file, so build output and local secrets never reach a commit: `dotnet new gitignore`
   Verify: `test -f .gitignore`

3. Create the solution: `dotnet new sln -n BlazorApp`
   Verify: `dotnet sln list`

4. Create the application with individual accounts on SQLite and Interactive Server as the render mode a component can opt into. The build prints warning NU1903 for the template's SQLite native library; that is expected, and step 6 removes it: `dotnet new blazor -o src/BlazorApp -f net10.0 --auth Individual --interactivity Server`
   Verify: `dotnet build src/BlazorApp`

5. Add the project to the solution: `dotnet sln add src/BlazorApp`
   Verify: `dotnet sln list`

6. Move the SQLite provider to a version whose native library is not under advisory GHSA-2m69-gcr7-jv3q (the template's resolves `SQLitePCLRaw.lib.e_sqlite3` 2.1.11): `dotnet add src/BlazorApp package Microsoft.EntityFrameworkCore.Sqlite --version 10.0.12`
   Verify: `dotnet restore src/BlazorApp`

7. Move the Identity store to the same servicing release: `dotnet add src/BlazorApp package Microsoft.AspNetCore.Identity.EntityFrameworkCore --version 10.0.12`
   Verify: `dotnet restore src/BlazorApp`

8. Move the database error page to the same servicing release: `dotnet add src/BlazorApp package Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore --version 10.0.12`
   Verify: `dotnet restore src/BlazorApp`

9. Move the EF Core command-line tools to the same servicing release: `dotnet add src/BlazorApp package Microsoft.EntityFrameworkCore.Tools --version 10.0.12`
   Verify: `dotnet build src/BlazorApp`

10. Create `Directory.Build.props`, which every project in the solution inherits:

    ```xml
    <Project>
      <!--
        A warning is an error, in every project including ones added later.
        The package audit covers the whole graph, not only the packages a
        project names: the SQLite advisory step 6 moved past arrived
        transitively, and with this in place a new one fails the build.
      -->
      <PropertyGroup>
        <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
        <NuGetAudit>true</NuGetAudit>
        <NuGetAuditMode>all</NuGetAuditMode>
      </PropertyGroup>
    </Project>
    ```

    Verify: `dotnet build src/BlazorApp`

11. Create `src/BlazorApp/Components/Account/LockoutSignInManager.cs` with:

    ```csharp
    using BlazorApp.Data;
    using Microsoft.AspNetCore.Authentication;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.Options;

    namespace BlazorApp.Components.Account;

    // The template's login page checks the password with lockoutOnFailure: false,
    // which leaves every account open to guessing at whatever rate a client can
    // send. Every password sign-in goes through this method, so overriding it
    // turns lockout on for all of them: the template's page, the same page
    // regenerated later, and any page written from scratch.
    public sealed class LockoutSignInManager(
        UserManager<ApplicationUser> userManager,
        IHttpContextAccessor contextAccessor,
        IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory,
        IOptions<IdentityOptions> optionsAccessor,
        ILogger<SignInManager<ApplicationUser>> logger,
        IAuthenticationSchemeProvider schemes,
        IUserConfirmation<ApplicationUser> confirmation)
        : SignInManager<ApplicationUser>(userManager, contextAccessor, claimsFactory, optionsAccessor, logger, schemes, confirmation)
    {
        public override Task<SignInResult> CheckPasswordSignInAsync(
            ApplicationUser user,
            string password,
            bool lockoutOnFailure) =>
            base.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
    }
    ```

    Verify: `dotnet build src/BlazorApp`

12. Replace `src/BlazorApp/Program.cs` with:

    ```csharp
    using BlazorApp.Components;
    using BlazorApp.Components.Account;
    using BlazorApp.Data;
    using Microsoft.AspNetCore.Authentication.Cookies;
    using Microsoft.AspNetCore.Components.Authorization;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;

    var builder = WebApplication.CreateBuilder(args);

    // Pages render on the server as plain HTML. A component that has to react
    // to the user opts in with @rendermode InteractiveServer and then runs on
    // the server over a SignalR circuit. The account pages stay static on
    // purpose: they read and write the authentication cookie, which only
    // exists on an HTTP request, never on a circuit.
    builder.Services.AddRazorComponents()
        .AddInteractiveServerComponents();

    builder.Services.AddCascadingAuthenticationState();
    builder.Services.AddScoped<IdentityRedirectManager>();
    builder.Services.AddScoped<AuthenticationStateProvider, IdentityRevalidatingAuthenticationStateProvider>();

    builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = IdentityConstants.ApplicationScheme;
            options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
        })
        .AddIdentityCookies();

    // Every authentication cookie is sent only over HTTPS, whatever the request
    // looked like to this process: behind a proxy that terminates TLS the
    // request arrives as http, and "same as request" would then issue the
    // cookie without Secure. The __Host- prefix makes the browser refuse the
    // cookie unless it is Secure, has Path=/ and names no Domain, so a sibling
    // subdomain cannot set or shadow it. This runs after the framework has
    // named each cookie, so it prefixes the names Identity chose.
    builder.Services.PostConfigureAll<CookieAuthenticationOptions>(options =>
    {
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.Name = $"__Host-{options.Cookie.Name}";
    });
    builder.Services.AddAntiforgery(options =>
    {
        options.Cookie.Name = "__Host-BlazorApp.Antiforgery";
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    });
    // A year rather than the framework's thirty days, so the policy does not
    // lapse between one visit and the next.
    builder.Services.AddHsts(options => options.MaxAge = TimeSpan.FromDays(365));

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString));
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();

    builder.Services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.SignIn.RequireConfirmedAccount = true;
            options.Stores.SchemaVersion = IdentitySchemaVersions.Version3;
            // Length is what makes a password hard to guess, and composition
            // rules push people towards predictable ones: fifteen characters,
            // any characters. The template's default is six, with a digit, an
            // upper-case letter and a symbol required.
            options.Password.RequiredLength = 15;
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            // The framework's defaults, written down so that changing them is a
            // visible diff. LockoutSignInManager is what makes them apply to the
            // login page.
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddSignInManager<LockoutSignInManager>()
        .AddDefaultTokenProviders();

    // Development only. With this sender registered, the registration page
    // shows the confirmation link on screen instead of emailing it, so anybody
    // could confirm an address they do not own. Outside Development a real
    // sender has to be registered, and the check below refuses to start
    // without one.
    if (builder.Environment.IsDevelopment())
    {
        builder.Services.AddSingleton<IEmailSender<ApplicationUser>, IdentityNoOpEmailSender>();
    }

    var app = builder.Build();

    if (app.Services.GetService<IEmailSender<ApplicationUser>>() is null)
    {
        throw new InvalidOperationException(
            "No IEmailSender<ApplicationUser> is registered. Register a real email sender before running outside Development.");
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseMigrationsEndPoint();
    }
    else
    {
        app.UseExceptionHandler("/Error", createScopeForErrors: true);
        app.UseHsts();
    }
    app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
    app.UseHttpsRedirection();

    // Every form Blazor renders carries a token, and a post without a valid one
    // is refused with 400 before any handler runs.
    app.UseAntiforgery();

    app.MapStaticAssets();
    app.MapRazorComponents<App>()
        .AddInteractiveServerRenderMode();

    // The endpoints the account pages post to that are not pages themselves:
    // sign-out, external login, passkeys and personal data download.
    app.MapAdditionalIdentityEndpoints();

    app.Run();
    ```

    Verify: `dotnet build src/BlazorApp`

13. Create the test project: `dotnet new xunit -o tests/BlazorApp.Tests -f net10.0`
    Verify: `dotnet build tests/BlazorApp.Tests`

14. Add the test project to the solution: `dotnet sln add tests/BlazorApp.Tests`
    Verify: `dotnet sln list`

15. Reference the application from the tests: `dotnet add tests/BlazorApp.Tests reference src/BlazorApp`
    Verify: `dotnet build tests/BlazorApp.Tests`

16. Add bUnit, which renders a component in memory without a browser: `dotnet add tests/BlazorApp.Tests package bunit --version 2.11.3`
    Verify: `dotnet build tests/BlazorApp.Tests`

17. Add the in-memory test host, so a test can make a real request through the whole pipeline: `dotnet add tests/BlazorApp.Tests package Microsoft.AspNetCore.Mvc.Testing --version 10.0.12`
    Verify: `dotnet build tests/BlazorApp.Tests`

18. Create `tests/BlazorApp.Tests/AppFactory.cs` with:

    ```csharp
    using BlazorApp.Data;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Microsoft.Data.Sqlite;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Hosting;

    namespace BlazorApp.Tests;

    // Boots the whole application in memory against a SQLite database of its
    // own, created from the migrations the template ships. The database file in
    // src/BlazorApp/Data is never opened, so no test depends on an account
    // somebody registered by hand.
    public sealed class AppFactory : WebApplicationFactory<Program>
    {
        private readonly string connectionString =
            $"Data Source=tests-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";

        // An in-memory SQLite database is deleted when its last connection
        // closes. This one stays open for as long as the factory lives.
        private readonly SqliteConnection keepAlive;

        public AppFactory()
        {
            keepAlive = new SqliteConnection(connectionString);
            keepAlive.Open();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder) =>
            builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString);

        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);
            using var scope = host.Services.CreateScope();
            // Migrate rather than EnsureCreated: this also fails if the model
            // has changed without a migration.
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.Migrate();
            return host;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                keepAlive.Dispose();
            }

            base.Dispose(disposing);
        }
    }
    ```

    Verify: `dotnet build tests/BlazorApp.Tests`

19. Create `tests/BlazorApp.Tests/ComponentTests.cs` with:

    ```csharp
    using BlazorApp.Components.Pages;
    using Bunit;

    namespace BlazorApp.Tests;

    // Component tests: the component renders in memory, with no server, no
    // browser and no circuit, and events are raised on the rendered markup.
    public sealed class ComponentTests : BunitContext
    {
        [Fact]
        public void Clicking_the_button_increments_the_count()
        {
            var counter = Render<Counter>();

            counter.Find("button").Click();

            Assert.Equal("Current count: 1", counter.Find("p[role=status]").TextContent);
        }

        [Fact]
        public void The_protected_page_greets_the_signed_in_user_by_name()
        {
            // A fake authentication state, so a component that reads the user
            // can be tested without Identity, a database or a cookie.
            AddAuthorization().SetAuthorized("test-user");

            var page = Render<Auth>();

            Assert.Contains("Hello test-user!", page.Markup);
        }
    }
    ```

    Verify: `dotnet build tests/BlazorApp.Tests`

20. Create `tests/BlazorApp.Tests/AccountTests.cs` with:

    ```csharp
    using System.Net;
    using System.Text.RegularExpressions;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Mvc.Testing;

    namespace BlazorApp.Tests;

    public sealed partial class AccountTests(AppFactory factory) : IClassFixture<AppFactory>
    {
        // Redirects are asserted rather than followed, and the base address is
        // https so that the HTTPS redirection middleware has nothing to do.
        private HttpClient CreateClient() =>
            factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("https://localhost"),
            });

        [Fact]
        public async Task An_anonymous_request_for_the_protected_page_is_redirected_to_login()
        {
            using var client = CreateClient();

            using var response = await client.GetAsync("/auth");

            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
            var location = new Uri(client.BaseAddress!, response.Headers.Location!);
            Assert.Equal("/Account/Login", location.AbsolutePath);
            Assert.Contains("ReturnUrl=%2Fauth", location.Query);
        }

        [Fact]
        public async Task A_login_post_without_an_antiforgery_token_is_refused()
        {
            using var client = CreateClient();

            using var response = await client.PostAsync("/Account/Login", LoginForm(token: null));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task A_login_post_with_the_token_from_the_form_reaches_the_page()
        {
            // The same post as above plus the token the page rendered, so the
            // 400 above can only have come from the missing token. The client
            // keeps the antiforgery cookie between the two requests.
            using var client = CreateClient();
            var html = await client.GetStringAsync("/Account/Login");
            var token = TokenField().Match(html).Groups[1].Value;
            Assert.NotEmpty(token);

            using var response = await client.PostAsync("/Account/Login", LoginForm(token));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("Invalid login attempt", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task The_antiforgery_cookie_is_host_prefixed_and_secure()
        {
            // Cookies are not kept by this client, so the header stays visible.
            using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost"),
                HandleCookies = false,
            });

            using var response = await client.GetAsync("/Account/Login");

            var cookie = Assert.Single(
                response.Headers.GetValues("Set-Cookie"),
                value => value.StartsWith("__Host-BlazorApp.Antiforgery=", StringComparison.Ordinal));
            Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Outside_development_the_app_refuses_to_start_without_an_email_sender()
        {
            using var production = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production"));

            var error = Assert.Throws<InvalidOperationException>(() => production.CreateClient());

            Assert.Contains("IEmailSender", error.Message);
        }

        private static FormUrlEncodedContent LoginForm(string? token)
        {
            var fields = new Dictionary<string, string>
            {
                ["_handler"] = "login",
                ["Input.Email"] = "nobody@example.com",
                ["Input.Password"] = "Not-a-real-password-1",
            };
            if (token is not null)
            {
                fields["__RequestVerificationToken"] = token;
            }

            return new FormUrlEncodedContent(fields);
        }

        [GeneratedRegex("name=\"__RequestVerificationToken\"[^>]*value=\"([^\"]+)\"")]
        private static partial Regex TokenField();
    }
    ```

    Verify: `dotnet build tests/BlazorApp.Tests`

21. Create `tests/BlazorApp.Tests/PasswordTests.cs` with:

    ```csharp
    using BlazorApp.Data;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.DependencyInjection;

    namespace BlazorApp.Tests;

    public sealed class PasswordTests(AppFactory factory) : IClassFixture<AppFactory>
    {
        private const string Password = "Not-a-real-password-1";

        [Fact]
        public async Task A_password_is_judged_by_its_length_not_its_character_classes()
        {
            using var scope = factory.Services.CreateScope();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Fourteen characters with every class the template used to demand.
            var tooShort = await users.CreateAsync(
                new ApplicationUser { UserName = "short@example.com", Email = "short@example.com" },
                "Aa1!aaaaaaaaaa");
            Assert.False(tooShort.Succeeded);

            // Twenty-one characters of lower-case words and spaces.
            var passphrase = await users.CreateAsync(
                new ApplicationUser { UserName = "long@example.com", Email = "long@example.com" },
                "plain lowercase words");
            Assert.True(passphrase.Succeeded, string.Join("; ", passphrase.Errors.Select(error => error.Description)));
        }

        [Fact]
        public async Task Wrong_passwords_lock_the_account_even_when_the_caller_asks_not_to()
        {
            using var scope = factory.Services.CreateScope();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var signIn = scope.ServiceProvider.GetRequiredService<SignInManager<ApplicationUser>>();

            var user = new ApplicationUser
            {
                UserName = "lockout@example.com",
                Email = "lockout@example.com",
                EmailConfirmed = true,
            };
            var created = await users.CreateAsync(user, Password);
            Assert.True(created.Succeeded, string.Join("; ", created.Errors.Select(error => error.Description)));

            // lockoutOnFailure: false is exactly what the template's login page
            // passes. Five wrong passwords lock the account regardless.
            SignInResult result = SignInResult.Failed;
            for (var attempt = 1; attempt <= 5; attempt++)
            {
                result = await signIn.PasswordSignInAsync(user.UserName, "wrong-password", isPersistent: false, lockoutOnFailure: false);
            }

            Assert.True(result.IsLockedOut);

            // Locked out means the right password does not help either.
            var correct = await signIn.PasswordSignInAsync(user.UserName, Password, isPersistent: false, lockoutOnFailure: false);
            Assert.True(correct.IsLockedOut);
        }
    }
    ```

    Verify: `dotnet build tests/BlazorApp.Tests`

22. Create `tests/BlazorApp.Tests/TransportTests.cs` with:

    ```csharp
    using Microsoft.AspNetCore.Authentication.Cookies;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.HttpsPolicy;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Options;

    namespace BlazorApp.Tests;

    // Read from the configured options rather than from a response: the
    // two-factor and remember-me cookies are only issued part-way through a
    // sign-in, and HSTS is only sent outside Development.
    public sealed class TransportTests(AppFactory factory) : IClassFixture<AppFactory>
    {
        [Fact]
        public void Every_authentication_cookie_is_host_prefixed_and_secure()
        {
            var cookies = factory.Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>();
            string[] schemes =
            [
                IdentityConstants.ApplicationScheme,
                IdentityConstants.ExternalScheme,
                IdentityConstants.TwoFactorUserIdScheme,
                IdentityConstants.TwoFactorRememberMeScheme,
            ];

            foreach (var scheme in schemes)
            {
                var cookie = cookies.Get(scheme).Cookie;
                Assert.StartsWith("__Host-", cookie.Name);
                Assert.Equal(CookieSecurePolicy.Always, cookie.SecurePolicy);
            }
        }

        [Fact]
        public void Strict_transport_security_lasts_at_least_a_year()
        {
            var hsts = factory.Services.GetRequiredService<IOptions<HstsOptions>>().Value;

            Assert.True(hsts.MaxAge >= TimeSpan.FromDays(365), $"max-age is {hsts.MaxAge}");
        }
    }
    ```

    Verify: `dotnet build tests/BlazorApp.Tests`

23. Remove the template's placeholder test: `rm tests/BlazorApp.Tests/UnitTest1.cs`
    Verify: `test ! -f tests/BlazorApp.Tests/UnitTest1.cs`

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: CI

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0
            with:
              global-json-file: global.json
          - run: dotnet restore
          - run: dotnet format --verify-no-changes --no-restore
          - run: dotnet build --configuration Release --no-restore
          - run: dotnet test --configuration Release --no-build
    ```

    Verify: `test -f .github/workflows/ci.yml`

25. Check that the code is formatted the way `dotnet format` would write it: `dotnet format --verify-no-changes`
    Verify: `dotnet format --verify-no-changes`

26. Build the solution: `dotnet build`
    Verify: `dotnet build --configuration Release`

27. Run the tests, which is where the protected page, the antiforgery check, the cookies and the password rules are proved: `dotnet test`
    Verify: `dotnet test`

28. Start the built application on a port the operating system chooses, and keep its process id. A fixed port can already be taken, and then the check either fails or answers from somebody else's server. Development, because outside it the application refuses to start until a real email sender is registered; the content root is the project directory, written relative to the assembly because that is what a relative content root is resolved against: `dotnet src/BlazorApp/bin/Debug/net10.0/BlazorApp.dll --contentRoot ../../.. --environment Development --urls http://127.0.0.1:0 > app.log 2>&1 & echo $! > app.pid`
    Verify: `test -s app.pid`

29. Read the address it chose out of its own log: `for attempt in $(seq 60); do grep -oE "http://127\.0\.0\.1:[0-9]+" app.log | head -1 > app.url && test -s app.url && break; sleep 1; done`
    Verify: `test -s app.url`

30. Fetch the home page, and keep it: `curl -fsS -o home.html "$(cat app.url)/"`
    Verify: `grep -q "_framework/blazor.web.js" home.html`

31. Fetch the script the home page names, which is what makes an interactive component interactive; without it every page still renders and no button does anything: `curl -fsS -o blazor.web.js "$(cat app.url)/_framework/blazor.web.js"`
    Verify: `test -s blazor.web.js`

32. Ask for the protected page without signing in, and keep the status and where it redirects: `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" "$(cat app.url)/auth" > auth.txt`
    Verify: `grep -qE "^302 .*/Account/Login\?ReturnUrl=%2Fauth" auth.txt`

33. Stop the application: `kill "$(cat app.pid)"`
    Verify: `sleep 2; ! kill -0 "$(cat app.pid)" 2>/dev/null`

34. Remove the files the check left behind: `rm app.log app.pid app.url home.html blazor.web.js auth.txt`
    Verify: `test ! -f app.pid`

## After setup

- `dotnet run --project src/BlazorApp` runs the application in Development,
  where the registration page shows the confirmation link instead of sending
  it. `src/BlazorApp/Data/app.db` is the template's SQLite database, already
  migrated.
- Before running anywhere else, register a real `IEmailSender<ApplicationUser>`
  in `Program.cs`, and delete the `IdentityNoOpEmailSender` block in
  `Components/Account/Pages/RegisterConfirmation.razor`. The application
  refuses to start outside Development until the first is done.
- A schema change is a migration:
  `dotnet ef migrations add <Name> --project src/BlazorApp`. The tests migrate
  a fresh database on every run, so a model change without a migration fails
  them.
