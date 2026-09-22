# .NET Worker Service

## What it fits

Long-running background processing: queue consumers, scheduled jobs, and
anything that does not answer HTTP requests.

## What it is NOT for

Anything that serves an API. Use `dotnet-web-api` for that.

## Trade-offs made on your behalf

A hosted service rather than a console loop, and EF Core for state.
