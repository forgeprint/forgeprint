# Setup

1. Create the solution: `dotnet new sln -n Worker`
   Verify: `test -f Worker.sln`

2. Create the worker project: `dotnet new worker -o src/Worker -f net10.0`
   Verify: `test -d src/Worker`

3. Add the database provider: `dotnet add src/Worker package Npgsql.EntityFrameworkCore.PostgreSQL`
   Verify: `dotnet build src/Worker`

4. Set up the queue client and the retry policy so the worker keeps going when the broker is unavailable.
   Verify: `dotnet build`

5. Build it: `dotnet build`
   Verify: `dotnet build`
