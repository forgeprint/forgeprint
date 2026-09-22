# Setup

1. Create the solution: `dotnet new sln -n App`
   Verify: `test -f App.sln`

2. Create the API project: `dotnet new webapi -o src/App.Api -f net10.0`
   Verify: `test -d src/App.Api`

3. Add the database provider: `dotnet add src/App.Api package Npgsql.EntityFrameworkCore.PostgreSQL`
   Verify: `dotnet build src/App.Api`

4. Build the solution: `dotnet build`
   Verify: `dotnet build`
