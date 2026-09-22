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

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = builder.Configuration["Oidc:Authority"];
            options.Audience = builder.Configuration["Oidc:Audience"];
            options.TokenValidationParameters.ValidateAudience =
                !string.IsNullOrEmpty(options.Audience);
        });

    // A request without a tenant claim is rejected before it reaches an
    // endpoint, so no endpoint has to remember to check.
    builder.Services
        .AddAuthorizationBuilder()
        .SetDefaultPolicy(
            new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireClaim(TenantResolutionMiddleware.ClaimType)
                .Build());

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

    Delete the template's placeholder test file `tests/Saas.Api.Tests/UnitTest1.cs`.

    Verify: `dotnet build tests/Saas.Api.Tests`

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

    Delete the template's placeholder test file `tests/Saas.Api.Tests/UnitTest1.cs`.

    Verify: `dotnet build tests/Saas.Api.Tests`

<!-- endif -->

22. Create `Dockerfile` with:

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

23. Create `.dockerignore` with:

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

24. Create `compose.yaml` for the local database with:

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
          - '5432:5432'
        healthcheck:
          test: ['CMD-SHELL', 'pg_isready -U app -d app']
          interval: 5s
          retries: 10
    ```

    Verify: `docker compose config`

<!-- endif -->

<!-- if options.database == sqlserver -->

24. Create `compose.yaml` for the local database with:

    ```yaml
    # Local development only. The API itself runs from the SDK, so that a code
    # change does not need an image rebuild.
    services:
      db:
        image: mcr.microsoft.com/mssql/server:2025-latest
        environment:
          ACCEPT_EULA: 'Y'
          MSSQL_SA_PASSWORD: 'Local-development-only-1'
        ports:
          - '1433:1433'
    ```

    Verify: `docker compose config`

<!-- endif -->

25. Create `.github/workflows/ci.yml` with:

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

26. Build the solution: `dotnet build`
    Verify: `dotnet build --configuration Release`

27. Run the tests, which is where tenant isolation is actually checked: `dotnet test`
    Verify: `dotnet test`

28. Build the container image: `docker build --tag saas-api:dev .`
    Verify: `docker image inspect saas-api:dev`

29. Start the container and check that it answers: `docker run -d --name saas-api-check -p 8080:8080 saas-api:dev`
    Verify: `curl -fsS http://localhost:8080/health`

30. Stop the check container: `docker rm -f saas-api-check`
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
