# Blazor Web App — agent context

Context for an agent working in a project created from the `blazor-web-app`
blueprint. Read it before changing code.

---

## What this project is

A Blazor Web App on ASP.NET Core 10 (LTS). Pages render on the server as plain
HTML; a component that has to react to the user opts into Interactive Server and
then runs on the server over a SignalR circuit. Accounts are ASP.NET Core
Identity with the template's Razor account pages, stored in SQLite through EF
Core. There is no JavaScript front end to build and no API between the UI and
the data: a component calls C# on the server directly.

## Layout

```
global.json                      SDK pin — CI reads it, do not bump one without the other
Directory.Build.props            warnings as errors and the package audit, for every project
BlazorApp.slnx                   solution
src/BlazorApp/
  Program.cs                     composition root: services, pipeline, the email-sender check
  Components/App.razor           the HTML document; loads blazor.web.js
  Components/Routes.razor        router; AuthorizeRouteView sends the anonymous to login
  Components/Pages/              pages (@page); static unless they declare a render mode
  Components/Layout/             layouts and navigation
  Components/Account/            Identity: account pages, LockoutSignInManager, redirect helpers
  Data/ApplicationDbContext.cs   the DbContext; Identity tables come from its base class
  Data/Migrations/               EF Core migrations, the template's initial one included
  Data/app.db                    the local SQLite database, already migrated
tests/BlazorApp.Tests/
  AppFactory.cs                  boots the real app against a fresh in-memory SQLite database
  ComponentTests.cs              bUnit: components rendered in memory
  AccountTests.cs                real requests: redirect to login, antiforgery, startup refusal
  LockoutTests.cs                five wrong passwords lock an account
.github/workflows/ci.yml         restore, format check, build, test
```

## Commands

| What              | Command                                                       |
| ----------------- | ------------------------------------------------------------- |
| Run (Development) | `dotnet run --project src/BlazorApp`                          |
| Build             | `dotnet build`                                                |
| Test              | `dotnet test`                                                 |
| Format            | `dotnet format` (CI runs `dotnet format --verify-no-changes`) |
| Add a migration   | `dotnet ef migrations add <Name> --project src/BlazorApp`     |

## Rules for this project

### Static by default; interactivity is a per-component decision

The render mode is set per page or component with
`@rendermode InteractiveServer`, never globally on `Routes` or `HeadOutlet` in
`App.razor`. Two reasons:

- **The account pages must stay static.** They read and write the
  authentication cookie through the cascading `HttpContext`, which exists on an
  HTTP request and is `null` on a circuit. Making everything interactive breaks
  sign-in in ways that compile.
- **Every interactive user holds a circuit** — server memory and an open
  connection for as long as the tab is open. A page that only displays data
  does not need one.

Do not add WebAssembly or Auto without a decision recorded somewhere a reviewer
can read it. It means a second project (`.Client`), components that must work in
the browser as well as on the server, and authentication state serialized to the
client. That is a different shape of application, not a setting.

### `[Authorize]` is the boundary; `<AuthorizeView>` is decoration

`@attribute [Authorize]` on a page puts authorization metadata on its endpoint,
so an anonymous request is redirected to `/Account/Login` before the page
renders (see `/auth`, and the test that proves it). `<AuthorizeView>` only
decides what markup to show; content it hides was still reachable. Every page
that needs a signed-in user carries the attribute.

An interactive component's event handlers run on the circuit, long after the
page's authorization check. A handler that changes data checks the user again
through `AuthenticationStateProvider` — the security stamp is only revalidated
every 30 minutes (`IdentityRevalidatingAuthenticationStateProvider`).

### Interactive components get a DbContext per operation

`ApplicationDbContext` is registered scoped, and on a circuit a scope lives as
long as the circuit. Injected into an interactive component, one context is
shared by every event handler for hours and is not thread-safe. When the first
interactive component needs data, register
`AddDbContextFactory<ApplicationDbContext>` and create a context per operation
with `await using var db = await factory.CreateDbContextAsync();`. Static pages
may inject the context directly: their scope is one request.

### Password lockout stays on

`LockoutSignInManager` forces `lockoutOnFailure: true` on every password check,
because the template's `Login.razor` passes `false`. Five failures lock the
account for five minutes (`options.Lockout` in `Program.cs`). Do not check a
password with `UserManager.CheckPasswordAsync` in new code — it bypasses lockout
entirely. Go through `SignInManager`.

### Passwords are judged by length

`options.Password` requires 15 characters and nothing else: no digit, capital
or symbol rules, which push people to `Password1!`. Do not reintroduce them.
The register and change-password pages still carry the template's
`[StringLength(..., MinimumLength = 6)]`; Identity's own rule is the one that
decides, and `PasswordTests` proves it.

### Cookies are `__Host-` and `Secure`, always

`Program.cs` prefixes every authentication cookie with `__Host-` and sets
`CookieSecurePolicy.Always`, and does the same for the antiforgery cookie. Do
not relax it to make plain http work: browsers accept secure cookies from
`http://localhost`, and anywhere else the application belongs behind HTTPS.
Behind a proxy that terminates TLS, forward the scheme with
`UseForwardedHeaders` rather than weakening the cookie. A cookie added later
gets the same treatment, and a test in `TransportTests`.

### The no-op email sender is Development only

`IdentityNoOpEmailSender` sends nothing, and while it is registered
`RegisterConfirmation.razor` prints the confirmation link on the page — anybody
can confirm an address they do not own. It is registered only in Development,
and `Program.cs` refuses to start anywhere else until a real
`IEmailSender<ApplicationUser>` is registered. When adding one, also delete the
`IdentityNoOpEmailSender` branch in `RegisterConfirmation.razor`. Do not remove
the startup check to make a deployment start.

### Forms carry an antiforgery token

`app.UseAntiforgery()` rejects any form post without a valid token with 400.
`<EditForm>` adds the token itself; a plain `<form method="post">` needs
`<AntiforgeryToken />` inside it. Never disable the check on an endpoint to make
a form work — the missing token is the bug.

### Warnings are errors, and so are advisories

`Directory.Build.props` applies `TreatWarningsAsErrors` and a package audit over
the whole dependency graph. A newly published advisory fails the build. The fix
is to move the package, not to add `NoWarn`; a suppression needs the advisory
id and a reason in a comment.

### Secrets and data

There are no secrets in configuration: the connection string points at a local
SQLite file. `Data/app.db` holds every account registered while developing, so
do not commit it once you have used the app; add it to `.gitignore` then. A
production database connection string comes from the environment
(`ConnectionStrings__DefaultConnection`), never from a committed file.

## When you are asked to...

**Add a page that needs sign-in:** add `@attribute [Authorize]` (and
`@using Microsoft.AspNetCore.Authorization`), and add a test to
`AccountTests.cs` that an anonymous request is redirected to `/Account/Login`.

**Add an interactive component:** put `@rendermode InteractiveServer` on it,
use `IDbContextFactory` for data, re-check the user in any handler that changes
data, and add a bUnit test to `ComponentTests.cs` that raises the event and
asserts the markup.

**Add an entity:** add it to `ApplicationDbContext`, then add a migration. The
tests migrate a fresh database on every run, so a model change without a
migration fails `dotnet test`.

**Deploy it:** register a real email sender, move to a server database if more
than one instance will run (SQLite is one file on one machine), configure data
protection keys to be shared and persisted, and use sticky sessions — a circuit
lives on the server that created it.

## What this does not do

- No roles or policies beyond "signed in"; `rbac` is not claimed.
- No email delivery, no external login provider configured.
- No container image and no deployment.
- No WebAssembly or Auto render mode, and nothing works offline.
- No rate limiting beyond account lockout.
- No check against common or breached passwords.
- Signing out does not revoke a copy of the cookie; changing the security
  stamp (`UserManager.UpdateSecurityStampAsync`) does, within 30 minutes.
- No Content-Security-Policy or other security headers beyond HSTS.
