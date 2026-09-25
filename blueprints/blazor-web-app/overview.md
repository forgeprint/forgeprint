# Blazor Web App

A server-rendered web application in C# with user accounts, where the UI and
the data access are the same codebase and there is no JavaScript build. Blazor
on .NET 10 (LTS), ASP.NET Core Identity on SQLite, Interactive Server for the
components that need it, and tests that prove the parts of authentication a
starter usually leaves unproved.

## What you get

- `dotnet new blazor` with individual accounts: registration, login, password
  reset, two-factor authentication and passkeys, as the template's Razor pages.
- **Static server rendering by default, Interactive Server by opt-in.** The
  counter page is interactive; everything else, including every account page,
  is plain HTML from the server.
- EF Core on SQLite with the template's initial Identity migration, the
  provider moved past the advisory the template's version carries
  (GHSA-2m69-gcr7-jv3q).
- **Five security fixes to the template's defaults**, each proved by a test:
  - password lockout that the template's login page leaves off, forced on for
    every password check (`LockoutSignInManager`);
  - the no-op email sender, which prints account confirmation links on the
    page, registered only in Development, with the application refusing to
    start anywhere else until a real sender exists;
  - passwords of at least 15 characters with no composition rules, instead of
    six characters with a digit, a capital and a symbol;
  - every authentication cookie and the antiforgery cookie `Secure` and
    `__Host-` prefixed, also behind a proxy that terminates TLS;
  - HSTS for a year rather than thirty days.
- Tests with bUnit (components rendered in memory, including one under a fake
  signed-in user) and `WebApplicationFactory` (real requests): an anonymous
  request for the protected page is redirected to login, a form post without an
  antiforgery token is refused with 400 and the same post with the token is
  not, five wrong passwords lock an account, a short password is refused and a
  long lower-case one is not, the cookies are prefixed and secure, and the
  migrations build the schema the model describes.
- Warnings as errors and a NuGet audit over the whole dependency graph, in
  `Directory.Build.props`; `dotnet format --verify-no-changes`.
- A CI workflow with actions pinned by commit SHA and read-only permissions.

## Options

None. The database is SQLite because the accounts need somewhere to live and
SQLite needs no server; see the trade-offs below for when to change it.

## What it fits

- An internal tool, admin area or line-of-business application written by a
  team whose language is C#, where a separate JavaScript front end would be a
  second stack to hire for.
- An application whose pages are mostly forms and tables behind a login, with
  a few components that need to react without a page reload.
- A product where the data must never leave the server: an interactive
  component on Interactive Server calls the database from C# on the server, so
  there is no public API to secure alongside the UI.

## What it is NOT for

- **A JavaScript single-page application with a .NET back end.** If the front
  end team works in React or Angular, or the same API has to serve a mobile
  app, use `dotnet-web-api` for the API and a front-end blueprint for the UI.
  An API designed for other clients is a contract; this blueprint has none.
- **An HTTP API.** There are no JSON endpoints here. `dotnet-web-api` is the
  API blueprint.
- **Multi-tenant SaaS.** Identity here has one user store and no tenant
  boundary. `dotnet-multitenant-saas-api` enforces tenant isolation in the data
  layer.
- **A public content site.** Marketing pages and documentation do not need
  accounts or a server holding circuits; `astro-content-site` builds static
  HTML.
- **Offline use or very many concurrent interactive users.** Interactive
  Server needs a live connection, and each interactive tab holds server memory.
  WebAssembly or Auto move work to the browser at the cost of a second project;
  this blueprint does not include either.
- **Roles and fine-grained permissions.** Only "signed in or not" is set up and
  tested; `rbac` is not claimed.

Also not done, and each is a gap a production deployment has to close:

- **No check against common or breached passwords.** Length is enforced;
  whether the password is `passwordpassword` is not.
- **Signing out does not revoke the cookie.** The browser forgets it, but a
  copy taken earlier stays valid until it expires or the user's security stamp
  changes (a password change does that; sign-out does not).
- **No Content-Security-Policy, `X-Content-Type-Options` or
  `Referrer-Policy` headers.** Add them where the application is hosted, or in
  middleware, once the scripts it loads are known.

## Trade-offs made on your behalf

### Interactive Server rather than Auto or WebAssembly

Auto starts on the server and moves a component to WebAssembly once the
runtime has downloaded. It is the more capable mode and it costs a second
project that runs in the browser, every interactive component written to work
in both places, authentication state serialized to the client, and an API for
any data a browser-side component needs. Interactive Server keeps one project,
one process and the data on the server. What it costs: latency on every
interaction (a round trip over SignalR), memory per connected user, and sticky
sessions when more than one instance runs. For forms behind a login, that is
the right side of the trade; for a public, highly interactive site it is not.

### Static rendering as the default

The template's `--all-interactive` flag makes every page interactive. It is
off here: account pages need the HTTP request that a circuit does not have, and
a page that only displays data should not hold a connection open.

### SQLite

The template's default for individual accounts, and the only choice that needs
no server, container or account to run the recipe. It is one file on one
machine: the day a second instance runs, move to PostgreSQL or SQL Server
(`AGENTS.md` lists what else changes then). An `options.database` was left out
to keep this recipe about Blazor rather than about databases, which
`dotnet-web-api` already covers.

### The template's account pages are kept, and two of their defaults changed

Rewriting the Identity UI would be a larger attack surface than keeping
Microsoft's. The two changes are the ones where the template's default is
unsafe outside a demo: lockout off, and a no-op email sender that shows
confirmation links on the page. Both are changed without editing the template's
pages, so regenerating a page from the template later does not undo them.

### Warnings and advisories fail the build

A new advisory on any package in the graph turns the build red, including on a
branch nobody touched. That is intended — it is how the SQLite advisory in the
template was found — and the fix is to move the package.

### No central package management

Package versions stay in each `.csproj`, as the template writes them and as
the other .NET blueprints here do. Central package management is a reasonable
next step once the solution has more than two projects.

### No container image

Nothing here needs one to run, and a Blazor Server deployment's hard parts —
sticky sessions, shared data protection keys, a real database — are not solved
by a Dockerfile. `dotnet-web-api` shows the catalog's container conventions.

## Cost of adoption

- **Tools:** the .NET 10 SDK, and curl for the recipe's final check.
- **Time:** the recipe runs in about two minutes on a warm package cache.
- **Before production:** a real email sender, a server database if more than
  one instance runs, persisted data protection keys, and sticky sessions.

## Compared with the alternatives here

| If you want...                                 | Use                           |
| ---------------------------------------------- | ----------------------------- |
| A C# web UI with accounts, no JavaScript build | `blazor-web-app`              |
| A C# HTTP API for other clients                | `dotnet-web-api`              |
| Tenant isolation in the data layer             | `dotnet-multitenant-saas-api` |
| A TypeScript full-stack application            | `nextjs-fullstack-app`        |
| A static content site                          | `astro-content-site`          |
