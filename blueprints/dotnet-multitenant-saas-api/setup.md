# Setup

Creates a multi-tenant SaaS API on ASP.NET Core 10 where tenant isolation is
enforced in the data layer, not in the endpoints, and where tests prove one
tenant cannot read another's rows.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires the .NET SDK 10 and Docker.

1. Pin the SDK so every machine builds with the same one: `dotnet new globaljson --sdk-version 10.0.100 --roll-forward latestFeature`
   Verify: `dotnet --version`

2. Create the solution: `dotnet new sln -n Saas`
   Verify: `dotnet sln list`

3. Create the API project: `dotnet new webapi -o src/Saas.Api -f net10.0`
   Verify: `dotnet build src/Saas.Api`

4. Add the project to the solution: `dotnet sln add src/Saas.Api`
   Verify: `dotnet sln list`

5. Replace the template's OpenAPI package with a version whose `Microsoft.OpenApi` dependency is not under advisory GHSA-v5pm-xwqc-g5wc: `dotnet add src/Saas.Api package Microsoft.AspNetCore.OpenApi --version 10.0.12`
   Verify: `dotnet restore src/Saas.Api`

<!-- if options.database == postgres -->

6. Add the PostgreSQL provider: `dotnet add src/Saas.Api package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.3`
   Verify: `dotnet restore src/Saas.Api`

7. Add the EF Core design-time package at the version the provider resolves: `dotnet add src/Saas.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.4`
   Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.database == sqlserver -->

6. Add the SQL Server provider: `dotnet add src/Saas.Api package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.12`
   Verify: `dotnet restore src/Saas.Api`

7. Add the EF Core design-time package: `dotnet add src/Saas.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.12`
   Verify: `dotnet build src/Saas.Api`

<!-- endif -->

8. Add bearer token validation, which is where the tenant identity comes from: `dotnet add src/Saas.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.12`
   Verify: `dotnet build src/Saas.Api`

9. Create the test project: `dotnet new xunit -o tests/Saas.Api.Tests -f net10.0`
   Verify: `dotnet build tests/Saas.Api.Tests`

10. Add the test project to the solution: `dotnet sln add tests/Saas.Api.Tests`
    Verify: `dotnet sln list`

11. Reference the API from the tests: `dotnet add tests/Saas.Api.Tests reference src/Saas.Api`
    Verify: `dotnet build tests/Saas.Api.Tests`

<!-- if options.tenancy == shared-db-tenant-column -->

12. Add a provider the isolation tests can run against without a database: `dotnet add tests/Saas.Api.Tests package Microsoft.EntityFrameworkCore.InMemory --version 10.0.4`
    Verify: `dotnet build tests/Saas.Api.Tests`

<!-- endif -->

13. Create `src/Saas.Api/Tenancy/ITenantContext.cs` with:

    ```csharp
    namespace Saas.Api.Tenancy;

    /// <summary>The tenant the current request belongs to.</summary>
    public interface ITenantContext
    {
        string TenantId { get; }
        bool IsResolved { get; }
    }

    public sealed class TenantContext : ITenantContext
    {
        private string? tenantId;

        public bool IsResolved => tenantId is not null;

        public string TenantId =>
            tenantId ?? throw new InvalidOperationException(
                "No tenant was resolved for this request. A tenant-scoped service was used outside a tenant request.");

        public void Resolve(string value) => tenantId = value;
    }
    ```

    Verify: `dotnet build src/Saas.Api`

14. Create `src/Saas.Api/Tenancy/TenantResolutionMiddleware.cs` with:

    ```csharp
    namespace Saas.Api.Tenancy;

    /// <summary>
    /// Reads the tenant from the access token. The tenant is never taken from a
    /// header, a query string or the route: those are caller-controlled, and a
    /// caller must not be able to choose whose data it reads.
    /// </summary>
    public sealed class TenantResolutionMiddleware(RequestDelegate next)
    {
        public const string ClaimType = "tenant_id";

        public async Task InvokeAsync(HttpContext context, TenantContext tenant)
        {
            var claim = context.User.FindFirst(ClaimType)?.Value;
            if (!string.IsNullOrWhiteSpace(claim))
            {
                tenant.Resolve(claim);
            }

            await next(context);
        }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- if options.database == postgres -->

15. Create `src/Saas.Api/Data/ProviderRegistration.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Npgsql;

    namespace Saas.Api.Data;

    // The only file that names a database provider.
    public static class ProviderRegistration
    {
        public static DbContextOptionsBuilder UseTenantProvider(
            this DbContextOptionsBuilder options,
            string connectionString) => options.UseNpgsql(connectionString);

        /// <summary>The same server and credentials, a different database.</summary>
        public static string WithDatabase(string connectionString, string database) =>
            new NpgsqlConnectionStringBuilder(connectionString) { Database = database }.ConnectionString;
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.database == sqlserver -->

15. Create `src/Saas.Api/Data/ProviderRegistration.cs` with:

    ```csharp
    using Microsoft.Data.SqlClient;
    using Microsoft.EntityFrameworkCore;

    namespace Saas.Api.Data;

    // The only file that names a database provider.
    public static class ProviderRegistration
    {
        public static DbContextOptionsBuilder UseTenantProvider(
            this DbContextOptionsBuilder options,
            string connectionString) => options.UseSqlServer(connectionString);

        /// <summary>The same server and credentials, a different database.</summary>
        public static string WithDatabase(string connectionString, string database) =>
            new SqlConnectionStringBuilder(connectionString) { InitialCatalog = database }.ConnectionString;
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == shared-db-tenant-column -->

16. Create `src/Saas.Api/Data/ITenantOwned.cs` with:

    ```csharp
    namespace Saas.Api.Data;

    /// <summary>Marks an entity that belongs to exactly one tenant.</summary>
    public interface ITenantOwned
    {
        string TenantId { get; set; }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == db-per-tenant -->

16. Create `src/Saas.Api/Data/TenantDatabaseName.cs` with:

    ```csharp
    using System.Text.RegularExpressions;

    namespace Saas.Api.Data;

    /// <summary>
    /// Turns a tenant identifier into a database name. The identifier arrives in
    /// a token and ends up inside a connection string, so it is validated rather
    /// than trusted.
    /// </summary>
    public static partial class TenantDatabaseName
    {
        public const string Prefix = "tenant_";

        public static string For(string tenantId)
        {
            if (!SafeTenantId().IsMatch(tenantId))
            {
                throw new InvalidOperationException(
                    $"Tenant identifier '{tenantId}' is not usable as a database name.");
            }

            return Prefix + tenantId.Replace('-', '_');
        }

        [GeneratedRegex("^[a-z0-9][a-z0-9-]{0,50}$")]
        private static partial Regex SafeTenantId();
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == shared-db-tenant-column -->

17. Create `src/Saas.Api/Data/AppDbContext.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Saas.Api.Tenancy;

    namespace Saas.Api.Data;

    public sealed class AppDbContext : DbContext
    {
        // Captured once per context instance. EF lifts this field into a query
        // parameter, so the compiled model is shared while the value is not.
        private readonly string tenantId;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant)
            : base(options) => tenantId = tenant.TenantId;

        public DbSet<Customer> Customers => Set<Customer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Customer>(customer =>
            {
                customer.HasKey(entity => entity.Id);
                customer.Property(entity => entity.TenantId).HasMaxLength(64).IsRequired();
                customer.Property(entity => entity.Name).HasMaxLength(200).IsRequired();
                customer.HasIndex(entity => new { entity.TenantId, entity.Name });

                // Every read of this entity is filtered, including reads written
                // by somebody who forgot tenancy exists.
                customer.HasQueryFilter(entity => entity.TenantId == tenantId);
            });
        }

        public override int SaveChanges()
        {
            StampTenant();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            StampTenant();
            return base.SaveChangesAsync(cancellationToken);
        }

        // Writes are stamped rather than trusted: an entity added without a
        // tenant would otherwise be invisible to everyone, or visible to the
        // wrong tenant.
        private void StampTenant()
        {
            foreach (var entry in ChangeTracker.Entries<ITenantOwned>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.TenantId = tenantId;
                }
                else if (entry.State != EntityState.Detached && entry.Entity.TenantId != tenantId)
                {
                    throw new InvalidOperationException(
                        $"Refusing to write an entity owned by tenant '{entry.Entity.TenantId}' as tenant '{tenantId}'.");
                }
            }
        }
    }

    public sealed class Customer : ITenantOwned
    {
        public Guid Id { get; set; }
        public string TenantId { get; set; } = string.Empty;
        public required string Name { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == db-per-tenant -->

17. Create `src/Saas.Api/Data/AppDbContext.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace Saas.Api.Data;

    // One database per tenant: isolation is physical, so there is no tenant
    // column and no query filter. The connection decides whose data this is.
    public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<Customer> Customers => Set<Customer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Customer>(customer =>
            {
                customer.HasKey(entity => entity.Id);
                customer.Property(entity => entity.Name).HasMaxLength(200).IsRequired();
                customer.HasIndex(entity => entity.Name);
            });
        }
    }

    public sealed class Customer
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == shared-db-tenant-column -->

18. Create `src/Saas.Api/Data/DatabaseRegistration.cs` with:

    ```csharp
    namespace Saas.Api.Data;

    public static class DatabaseRegistration
    {
        public static IServiceCollection AddTenantDatabase(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("Default")
                ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

            // One database for everyone. Isolation is the query filter in
            // AppDbContext, which is why that filter is tested rather than
            // trusted.
            return services.AddDbContext<AppDbContext>(options =>
                options.UseTenantProvider(connectionString));
        }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.tenancy == db-per-tenant -->

18. Create `src/Saas.Api/Data/DatabaseRegistration.cs` with:

    ```csharp
    using Saas.Api.Tenancy;

    namespace Saas.Api.Data;

    public static class DatabaseRegistration
    {
        public static IServiceCollection AddTenantDatabase(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var baseConnection = configuration.GetConnectionString("Default")
                ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

            // The database is chosen per request from the resolved tenant, so a
            // query cannot reach another tenant's data even by mistake.
            services.AddDbContext<AppDbContext>((provider, options) =>
            {
                var tenant = provider.GetRequiredService<ITenantContext>();
                var database = TenantDatabaseName.For(tenant.TenantId);
                options.UseTenantProvider(ProviderRegistration.WithDatabase(baseConnection, database));
            });

            return services;
        }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.database == postgres -->

19. Create `src/Saas.Api/appsettings.Development.json` with:

    ```json
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning"
        }
      },
      "ConnectionStrings": {
        "Default": "Host=localhost;Port=5432;Database=app;Username=app;Password=local-development-only"
      }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

<!-- if options.database == sqlserver -->

19. Create `src/Saas.Api/appsettings.Development.json` with:

    ```json
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning"
        }
      },
      "ConnectionStrings": {
        "Default": "Server=localhost,1433;Database=app;User Id=sa;Password=Local-development-only-1;TrustServerCertificate=True"
      }
    }
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- endif -->

20. Replace `src/Saas.Api/Program.cs` with:

    ```csharp
    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.EntityFrameworkCore;
    using Saas.Api.Data;
    using Saas.Api.Tenancy;

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddOpenApi();
    builder.Services.AddProblemDetails();
    builder.Services.AddHealthChecks();

    builder.Services.AddScoped<TenantContext>();
    builder.Services.AddScoped<ITenantContext>(services => services.GetRequiredService<TenantContext>());

    builder.Services.AddTenantDatabase(builder.Configuration);

    // Read and check here, not inside the options delegate: that delegate runs
    // when the options are first resolved, which is on a request, so a missing
    // setting would be a 500 on every call instead of a service that refuses to
    // start.
    //
    // Both are required. Deriving ValidateAudience from whether the audience
    // happens to be set turns a missing setting into silently accepting any
    // token this authority issued — including one minted for a different
    // application, carrying a tenant_id claim of its own. This service decides
    // whose data you see from that claim.
    var authority = builder.Configuration["Oidc:Authority"]
        ?? throw new InvalidOperationException("Oidc:Authority is required.");
    var audience = builder.Configuration["Oidc:Audience"]
        ?? throw new InvalidOperationException("Oidc:Audience is required.");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = authority;
            options.Audience = audience;
        });

    // A request without a tenant claim is rejected before it reaches an
    // endpoint, so no endpoint has to remember to check.
    //
    // Fallback, not only default: the default policy applies to endpoints that
    // ask for authorization without naming a policy, and does nothing for an
    // endpoint that asks for none. The fallback is what covers the endpoint
    // somebody adds without thinking about it. Both are set so that a bare
    // .RequireAuthorization() means the same thing.
    var tenantPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireClaim(TenantResolutionMiddleware.ClaimType)
        .Build();

    builder.Services
        .AddAuthorizationBuilder()
        .SetDefaultPolicy(tenantPolicy)
        .SetFallbackPolicy(tenantPolicy);

    var app = builder.Build();

    app.UseExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseAuthentication();

    // Order matters: the tenant is read from the authenticated principal, so
    // this runs after authentication and before anything that touches data.
    app.UseMiddleware<TenantResolutionMiddleware>();

    app.UseAuthorization();

    // Tenant-independent. It answers whether the process is alive, nothing else.
    app.MapHealthChecks("/health").AllowAnonymous();

    app.MapGet("/customers", async (AppDbContext db, CancellationToken token) =>
            await db.Customers.OrderBy(customer => customer.Name).ToListAsync(token))
        .WithName("ListCustomers");

    app.Run();

    // The integration tests boot the application through this entry point.
    public partial class Program;
    ```

    Verify: `dotnet build src/Saas.Api`

<!-- if options.tenancy == shared-db-tenant-column -->

21. Create `tests/Saas.Api.Tests/TenantIsolationTests.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;
    using Saas.Api.Data;
    using Saas.Api.Tenancy;

    namespace Saas.Api.Tests;

    public sealed class TenantIsolationTests
    {
        private sealed class FixedTenant(string tenantId) : ITenantContext
        {
            public string TenantId { get; } = tenantId;
            public bool IsResolved => true;
        }

        private static DbContextOptions<AppDbContext> SharedStore() =>
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"tenancy-{Guid.NewGuid()}")
                .Options;

        private static AppDbContext ContextFor(DbContextOptions<AppDbContext> options, string tenantId) =>
            new(options, new FixedTenant(tenantId));

        private static void SeedCustomer(DbContextOptions<AppDbContext> options, string tenantId, string name)
        {
            using var context = ContextFor(options, tenantId);
            context.Customers.Add(new Customer { Name = name });
            context.SaveChanges();
        }

        [Fact]
        public void A_tenant_cannot_read_another_tenants_rows()
        {
            var options = SharedStore();
            SeedCustomer(options, "tenant-a", "Contoso");

            using var tenantB = ContextFor(options, "tenant-b");

            Assert.Empty(tenantB.Customers.ToList());
        }

        [Fact]
        public void A_tenant_reads_its_own_rows()
        {
            var options = SharedStore();
            SeedCustomer(options, "tenant-a", "Contoso");

            using var again = ContextFor(options, "tenant-a");

            Assert.Equal("Contoso", Assert.Single(again.Customers.ToList()).Name);
        }

        [Fact]
        public void The_filter_is_not_baked_into_the_cached_model()
        {
            // EF caches the compiled model per context type. If the tenant value
            // were captured into the model rather than into a query parameter,
            // the second tenant would read with the first one's identifier.
            var options = SharedStore();
            SeedCustomer(options, "tenant-a", "Contoso");
            SeedCustomer(options, "tenant-b", "Fabrikam");

            using var readerB = ContextFor(options, "tenant-b");

            Assert.Equal("Fabrikam", Assert.Single(readerB.Customers.ToList()).Name);
        }

        [Fact]
        public void A_write_is_stamped_with_the_current_tenant()
        {
            var options = SharedStore();

            using var tenantA = ContextFor(options, "tenant-a");
            var customer = new Customer { Name = "Contoso" };
            tenantA.Customers.Add(customer);
            tenantA.SaveChanges();

            Assert.Equal("tenant-a", customer.TenantId);
        }

        [Fact]
        public void A_row_smuggled_in_with_another_tenants_identifier_is_restamped()
        {
            var options = SharedStore();

            using var tenantB = ContextFor(options, "tenant-b");
            var smuggled = new Customer { Name = "Smuggled", TenantId = "tenant-a" };
            tenantB.Customers.Add(smuggled);
            tenantB.SaveChanges();

            Assert.Equal("tenant-b", smuggled.TenantId);
        }
    }
    ```

    Verify: `dotnet build tests/Saas.Api.Tests`

22. Remove the template's placeholder test: `rm tests/Saas.Api.Tests/UnitTest1.cs`
    Verify: `test ! -f tests/Saas.Api.Tests/UnitTest1.cs`

<!-- endif -->

<!-- if options.tenancy == db-per-tenant -->

21. Create `tests/Saas.Api.Tests/TenantDatabaseNameTests.cs` with:

    ```csharp
    using Saas.Api.Data;

    namespace Saas.Api.Tests;

    public sealed class TenantDatabaseNameTests
    {
        [Fact]
        public void Each_tenant_maps_to_its_own_database()
        {
            Assert.Equal("tenant_acme", TenantDatabaseName.For("acme"));
            Assert.Equal("tenant_big_corp", TenantDatabaseName.For("big-corp"));
            Assert.NotEqual(TenantDatabaseName.For("acme"), TenantDatabaseName.For("acme2"));
        }

        [Theory]
        [InlineData("acme;Host=elsewhere")]
        [InlineData("../acme")]
        [InlineData("ACME")]
        [InlineData("")]
        public void An_identifier_that_could_alter_the_connection_is_refused(string tenantId)
        {
            Assert.Throws<InvalidOperationException>(() => TenantDatabaseName.For(tenantId));
        }
    }
    ```

    Verify: `dotnet build tests/Saas.Api.Tests`

22. Remove the template's placeholder test: `rm tests/Saas.Api.Tests/UnitTest1.cs`
    Verify: `test ! -f tests/Saas.Api.Tests/UnitTest1.cs`

<!-- endif -->

23. Add the in-memory test host, so a test can make a real request: `dotnet add tests/Saas.Api.Tests package Microsoft.AspNetCore.Mvc.Testing --version 10.0.12`
    Verify: `dotnet build tests/Saas.Api.Tests`

24. Create `tests/Saas.Api.Tests/AuthorizationTests.cs` with:

    ```csharp
    using System.Net;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Mvc.Testing;

    namespace Saas.Api.Tests;

    // The application refuses to start without its authentication settings, so
    // the test host supplies them — with values nothing ever contacts. These
    // tests never present a token, and an unauthenticated request is refused
    // before any token is validated or any metadata is fetched.
    public sealed class ApiFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder) =>
            builder
                .UseSetting("Oidc:Authority", "https://localhost/issuer")
                .UseSetting("Oidc:Audience", "saas-api-tests")
                .UseSetting("ConnectionStrings:Default", "Host=localhost;Database=app;Username=app;Password=not-used-in-these-tests");
    }

    public sealed class AuthorizationTests(ApiFactory factory) : IClassFixture<ApiFactory>
    {
        [Fact]
        public async Task An_endpoint_that_declares_nothing_is_still_refused()
        {
            // /customers declares no authorization of its own. A 401 here can
            // only come from the fallback policy, so this test guards the
            // default rather than the endpoint — and it fails the day somebody
            // writes SetDefaultPolicy without SetFallbackPolicy again.
            using var client = factory.CreateClient();

            using var response = await client.GetAsync("/customers");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Health_is_the_one_endpoint_that_opts_out()
        {
            using var client = factory.CreateClient();

            using var response = await client.GetAsync("/health");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
    ```

    Verify: `dotnet build tests/Saas.Api.Tests`

25. Create `Dockerfile` with:

    ```dockerfile
    # Build stage: restore first, so a code change does not re-download packages.
    FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
    WORKDIR /source

    COPY global.json ./
    COPY src/Saas.Api/Saas.Api.csproj src/Saas.Api/
    RUN dotnet restore src/Saas.Api/Saas.Api.csproj

    COPY src/ src/
    RUN dotnet publish src/Saas.Api/Saas.Api.csproj --configuration Release --no-restore --output /publish

    # Runtime stage: no SDK, no source, no root.
    FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
    WORKDIR /app
    COPY --from=build /publish ./
    USER $APP_UID
    EXPOSE 8080
    ENTRYPOINT ["dotnet", "Saas.Api.dll"]
    ```

    Verify: `test -f Dockerfile`

26. Create `.dockerignore` with:

    ```gitignore
    **/bin/
    **/obj/
    **/.vs/
    **/.vscode/
    .git/
    .github/
    tests/
    Dockerfile
    compose.yaml
    ```

    Verify: `test -f .dockerignore`

<!-- if options.database == postgres -->

27. Create `compose.yaml` for the local database with:

    ```yaml
    # Local development only. The API itself runs from the SDK, so that a code
    # change does not need an image rebuild.
    services:
      db:
        image: postgres:18-alpine
        environment:
          POSTGRES_DB: app
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
        ports:
          - '127.0.0.1:5432:5432'
        healthcheck:
          test: ['CMD-SHELL', 'pg_isready -U app -d app']
          interval: 5s
          retries: 10
    ```

    Verify: `docker compose config`

<!-- endif -->

<!-- if options.database == sqlserver -->

27. Create `compose.yaml` for the local database with:

    ```yaml
    # Local development only. The API itself runs from the SDK, so that a code
    # change does not need an image rebuild.
    services:
      db:
        image: mcr.microsoft.com/mssql/server:2025-CU9-ubuntu-24.04
        environment:
          ACCEPT_EULA: 'Y'
          MSSQL_SA_PASSWORD: 'Local-development-only-1'
        ports:
          - '127.0.0.1:1433:1433'
    ```

    Verify: `docker compose config`

<!-- endif -->

28. Create `.github/workflows/ci.yml` with:

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
          - run: dotnet build --configuration Release --no-restore
          - run: dotnet test --configuration Release --no-build
          - run: docker build --tag saas-api:ci .
    ```

    Verify: `test -f .github/workflows/ci.yml`

29. Build the solution: `dotnet build`
    Verify: `dotnet build --configuration Release`

30. Run the tests, which is where tenant isolation is actually checked: `dotnet test`
    Verify: `dotnet test`

31. Build the container image: `docker build --tag saas-api:dev .`
    Verify: `docker image inspect saas-api:dev`

32. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force saas-api-check 2>/dev/null || true`
    Verify: `test -z "$(docker ps --all --filter name=saas-api-check --quiet)"`

33. Start the container and check that it answers. The image takes its configuration from the environment, and the API refuses to start without a connection string or its authentication settings, so they are supplied here — which also shows the `__` form the application expects; the liveness endpoint never touches the database: `docker run -d --name saas-api-check -e ConnectionStrings__Default="Host=db;Database=app;Username=app;Password=local-development-only" -e Oidc__Authority="https://localhost/issuer" -e Oidc__Audience="saas-api" -p 127.0.0.1::8080 saas-api:dev`
    Verify: `curl -fsS --retry 30 --retry-delay 1 --retry-all-errors "http://$(docker port saas-api-check 8080)/health"`

34. Stop the check container: `docker rm --force saas-api-check`
    Verify: `docker ps --filter name=saas-api-check --quiet`

## After setup

- There are no migrations yet. Create the first one when the model is real:
  `dotnet ef migrations add Initial --project src/Saas.Api`. With the
  `db-per-tenant` option, migrations are applied once per tenant database —
  `AGENTS.md` describes how tenant onboarding differs between the two options.
- Set `Oidc:Authority` and `Oidc:Audience`, and configure your provider to put a
  `tenant_id` claim in the access token. Without that claim every request is
  rejected, which is the intended behaviour.
- `Customer` exists to make the isolation tests concrete. Replace it with your
  own model, and keep the tests.
