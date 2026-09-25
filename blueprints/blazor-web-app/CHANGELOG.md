# Changelog — blazor-web-app

## 1.0.0 — 2026-09-25

First version.

A Blazor Web App on .NET 10 (LTS; .NET 11 is at RC 1 today) with ASP.NET Core
Identity on SQLite, static server rendering by default and Interactive Server
where a component opts in, bUnit component tests, and a CI workflow.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where Blazor had 7.0% in the Stack Overflow 2025 survey and
`Microsoft.AspNetCore.Components.Web` 357.2M total NuGet downloads. A tool
drafted it, CI runs its recipe, and nobody has built an application on it, so it
is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). It is **not
manually verified**.

Run with `forgeprint test-setup` on Windows 11 with the .NET SDK 10.0.103 (all
34 steps, 11 tests passing) before the pull request opened. Versions checked
against the NuGet API on 2026-09-25: the ASP.NET Core and EF Core packages at
10.0.12, bUnit 2.11.3. The actions in the generated CI workflow are the latest
releases of each, pinned by SHA.

Three things came out of running it rather than describing it.

**The template's SQLite library is under a high-severity advisory.**
`dotnet new blazor --auth Individual` resolves `SQLitePCLRaw.lib.e_sqlite3`
2.1.11 (GHSA-2m69-gcr7-jv3q). EF Core 10.0.12 moves it past the advisory, and
the package audit now fails the build if one comes back.

**The template's authentication defaults are a demo's.** Lockout is off, the
no-op email sender prints confirmation links on the page, passwords need six
characters plus composition rules, cookies are only `Secure` when the request
was, and HSTS lasts thirty days. The architecture review
([docs/reviews/blazor-web-app/2026-09-25.md](../../docs/reviews/blazor-web-app/2026-09-25.md))
found all five against ASVS 5.0 level 1, four `high` and one `medium`. All five are
fixed without editing the template's pages, so regenerating one does not undo
them, and each is proved by a test that fails if the fix is removed.

**A project named `App.Web` does not compile.** The template's root component
is `App`, and a namespace starting with `App` hides it. The project is
`BlazorApp`.

### Planned

- An `options.database` for PostgreSQL, if anybody asks for one.
- Roles, once a blueprint can prove them with a test the way it proves
  sign-in.
