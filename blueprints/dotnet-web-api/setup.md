# Setup

Creates an ASP.NET Core 10 REST API with EF Core, bearer authentication, a
container image and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires the .NET SDK 10 and Docker.

1. Pin the SDK so every machine builds with the same one: `dotnet new globaljson --sdk-version 10.0.100 --roll-forward latestFeature`
   Verify: `dotnet --version`

2. Create the solution: `dotnet new sln -n App`
   Verify: `dotnet sln list`

3. Create the API project: `dotnet new webapi -o src/App.Api -f net10.0`
   Verify: `dotnet build src/App.Api`

4. Add the project to the solution: `dotnet sln add src/App.Api`
   Verify: `dotnet sln list`

5. Replace the template's OpenAPI package with a version whose `Microsoft.OpenApi` dependency is not under advisory GHSA-v5pm-xwqc-g5wc: `dotnet add src/App.Api package Microsoft.AspNetCore.OpenApi --version 10.0.12`
   Verify: `dotnet restore src/App.Api`

<!-- if options.database == postgres -->

6. Add the PostgreSQL provider: `dotnet add src/App.Api package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.3`
   Verify: `dotnet restore src/App.Api`

7. Add the EF Core design-time package, at the version the provider resolves so the build stays warning-free: `dotnet add src/App.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.4`
   Verify: `dotnet build src/App.Api`

<!-- endif -->

<!-- if options.database == sqlserver -->

6. Add the SQL Server provider: `dotnet add src/App.Api package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.12`
   Verify: `dotnet restore src/App.Api`

7. Add the EF Core design-time package: `dotnet add src/App.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.12`
   Verify: `dotnet build src/App.Api`

<!-- endif -->

8. Add bearer token validation: `dotnet add src/App.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.12`
   Verify: `dotnet build src/App.Api`

9. Create the test project: `dotnet new xunit -o tests/App.Api.Tests -f net10.0`
   Verify: `dotnet build tests/App.Api.Tests`

10. Add the test project to the solution: `dotnet sln add tests/App.Api.Tests`
    Verify: `dotnet sln list`

11. Reference the API from the tests: `dotnet add tests/App.Api.Tests reference src/App.Api`
    Verify: `dotnet build tests/App.Api.Tests`

12. Add the in-memory test host: `dotnet add tests/App.Api.Tests package Microsoft.AspNetCore.Mvc.Testing --version 10.0.12`
    Verify: `dotnet build tests/App.Api.Tests`

13. Create `src/App.Api/Data/AppDbContext.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace App.Api.Data;

    public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<Item> Items => Set<Item>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Item>(item =>
            {
                item.HasKey(entity => entity.Id);
                item.Property(entity => entity.Name).HasMaxLength(200).IsRequired();
            });
        }
    }

    public sealed class Item
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
    ```

    Verify: `dotnet build src/App.Api`

<!-- if options.database == postgres -->

14. Create `src/App.Api/Data/DatabaseRegistration.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace App.Api.Data;

    // The only file that names a database provider.
    public static class DatabaseRegistration
    {
        public static IServiceCollection AddAppDatabase(
            this IServiceCollection services,
            IConfiguration configuration) =>
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("Default")));
    }
    ```

    Verify: `dotnet build src/App.Api`

15. Create `src/App.Api/appsettings.Development.json` with:

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

    Verify: `dotnet build src/App.Api`

<!-- endif -->

<!-- if options.database == sqlserver -->

14. Create `src/App.Api/Data/DatabaseRegistration.cs` with:

    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace App.Api.Data;

    // The only file that names a database provider.
    public static class DatabaseRegistration
    {
        public static IServiceCollection AddAppDatabase(
            this IServiceCollection services,
            IConfiguration configuration) =>
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("Default")));
    }
    ```

    Verify: `dotnet build src/App.Api`

15. Create `src/App.Api/appsettings.Development.json` with:

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

    Verify: `dotnet build src/App.Api`

<!-- endif -->

<!-- if options.auth == jwt -->

16. Create `src/App.Api/Authentication/AuthenticationRegistration.cs` with:

    ```csharp
    using Microsoft.AspNetCore.Authentication.JwtBearer;

    namespace App.Api.Authentication;

    // Token validation settings come from configuration, so no secret is
    // written into source. The keys are listed in AGENTS.md.
    public static class AuthenticationRegistration
    {
        public static IServiceCollection AddApiAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = configuration["Authentication:Schemes:Bearer:Authority"];
                    options.TokenValidationParameters.ValidAudiences = configuration
                        .GetSection("Authentication:Schemes:Bearer:ValidAudiences")
                        .Get<string[]>();
                });
            services.AddAuthorization();
            return services;
        }
    }
    ```

    Verify: `dotnet build src/App.Api`

<!-- endif -->

<!-- if options.auth == oidc -->

16. Create `src/App.Api/Authentication/AuthenticationRegistration.cs` with:

    ```csharp
    using Microsoft.AspNetCore.Authentication.JwtBearer;

    namespace App.Api.Authentication;

    // Tokens are issued by an external OIDC provider. Signing keys are
    // discovered from its metadata, so nothing secret is configured here.
    public static class AuthenticationRegistration
    {
        public static IServiceCollection AddApiAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = configuration["Oidc:Authority"];
                    options.Audience = configuration["Oidc:Audience"];
                    options.TokenValidationParameters.ValidateAudience =
                        !string.IsNullOrEmpty(options.Audience);
                });
            services.AddAuthorization();
            return services;
        }
    }
    ```

    Verify: `dotnet build src/App.Api`

<!-- endif -->

17. Replace `src/App.Api/Program.cs` with:

    ```csharp
    using App.Api.Authentication;
    using App.Api.Data;
    using Microsoft.EntityFrameworkCore;

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddOpenApi();
    builder.Services.AddProblemDetails();
    builder.Services.AddHealthChecks();
    builder.Services.AddAppDatabase(builder.Configuration);
    builder.Services.AddApiAuthentication(builder.Configuration);

    var app = builder.Build();

    app.UseExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    // Liveness only. If this touched the database, one database blip would
    // restart every healthy container and turn a degradation into an outage.
    app.MapHealthChecks("/health");

    app.MapGet("/items", async (AppDbContext db, CancellationToken token) =>
            await db.Items.OrderBy(item => item.CreatedAt).ToListAsync(token))
        .RequireAuthorization()
        .WithName("ListItems");

    app.Run();

    // The integration tests boot the application through this entry point.
    public partial class Program;
    ```

    Verify: `dotnet build src/App.Api`

18. Replace the generated test with `tests/App.Api.Tests/HealthEndpointTests.cs`:

    ```csharp
    using System.Net;
    using Microsoft.AspNetCore.Mvc.Testing;

    namespace App.Api.Tests;

    public sealed class HealthEndpointTests(WebApplicationFactory<Program> factory)
        : IClassFixture<WebApplicationFactory<Program>>
    {
        [Fact]
        public async Task Health_reports_healthy_without_a_database()
        {
            using var client = factory.CreateClient();

            using var response = await client.GetAsync("/health");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Items_requires_authentication()
        {
            using var client = factory.CreateClient();

            using var response = await client.GetAsync("/items");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
    ```

    Verify: `dotnet build tests/App.Api.Tests`

19. Remove the template's placeholder test: `rm tests/App.Api.Tests/UnitTest1.cs`
    Verify: `test ! -f tests/App.Api.Tests/UnitTest1.cs`

20. Create `Dockerfile` with:

    ```dockerfile
    # Build stage: restore first, so a code change does not re-download packages.
    FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
    WORKDIR /source

    COPY global.json ./
    COPY src/App.Api/App.Api.csproj src/App.Api/
    RUN dotnet restore src/App.Api/App.Api.csproj

    COPY src/ src/
    RUN dotnet publish src/App.Api/App.Api.csproj --configuration Release --no-restore --output /publish

    # Runtime stage: no SDK, no source, no root.
    FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
    WORKDIR /app
    COPY --from=build /publish ./
    USER $APP_UID
    EXPOSE 8080
    ENTRYPOINT ["dotnet", "App.Api.dll"]
    ```

    Verify: `test -f Dockerfile`

21. Create `.dockerignore` with:

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

22. Create `compose.yaml` for the local database with:

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

22. Create `compose.yaml` for the local database with:

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

23. Create `.github/workflows/ci.yml` with:

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
          - run: docker build --tag app-api:ci .
    ```

    Verify: `test -f .github/workflows/ci.yml`

24. Build the solution: `dotnet build`
    Verify: `dotnet build --configuration Release`

25. Run the tests: `dotnet test`
    Verify: `dotnet test`

26. Build the container image: `docker build --tag app-api:dev .`
    Verify: `docker image inspect app-api:dev`

27. Start the container and check that it answers: `docker run -d --name app-api-check -p 127.0.0.1::8080 app-api:dev`
    Verify: `curl -fsS --retry 10 --retry-delay 1 --retry-connrefused "http://$(docker port app-api-check 8080)/health"`

28. Stop the check container: `docker rm -f app-api-check`
    Verify: `docker ps --filter name=app-api-check --quiet`

## After setup

- `dotnet run --project src/App.Api` runs the API; `docker compose up -d`
  starts the database it talks to.
- There are no migrations yet. Create the first one when the model is real:
  `dotnet ef migrations add Initial --project src/App.Api`. The
  `efcore-migrations` skill covers the workflow.
- Set the authentication configuration before the API is useful. The keys are
  listed in `AGENTS.md`; they belong in the environment or in user secrets,
  never in a committed file.
