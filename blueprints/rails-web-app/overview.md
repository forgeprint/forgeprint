# Rails Web App

A Rails 8.1 application on SQLite with the authentication Rails generates,
tightened in three places: a password floor, an absolute session lifetime, and
a recurring Solid Queue job that purges expired sessions. The setup runs the
tests, RuboCop and Brakeman, then builds the generated production image, starts
it, and checks that the protected page redirects a visitor with no session.

**Generated, CI-tested, not manually verified.** The recipe executes in CI like
every other blueprint here. Nobody has built an application on it first, which
is what `tier: official` means in this catalog and why this is `community`.

## What you get

- Rails 8.1.4 with the Rails 8 defaults: SQLite for everything, Solid Queue,
  Solid Cache and Solid Cable in the database, Propshaft, import maps, Hotwire.
  No Node, no Redis.
- `bin/rails generate authentication`: sign-in, sign-out and password reset,
  database-backed sessions in a signed, HTTP-only cookie, rate-limited sign-in.
- A 15-character password minimum, a 30-day absolute session lifetime enforced
  on every lookup (including Action Cable), and the cookie expiring with it.
- One page behind sign-in at `/`, with a test that proves a visitor without a
  session is redirected, and one that proves an expired session is refused.
- `PurgeExpiredSessionsJob`, scheduled daily in `config/recurring.yml`, tested
  with the Active Job test helpers.
- Every gem the application names pinned to an exact version in the `Gemfile`.
- The generated GitHub Actions workflow — Brakeman, bundler-audit, importmap
  audit, RuboCop, tests — with every action pinned by commit and a read-only
  token.
- The generated Dockerfile: multi-stage, runs as uid 1000, keeps
  `config/master.key` out of the image. The setup builds it, checks the user
  and the missing key, starts it in production mode and asks `/up`.

## Options

None. The database is SQLite because that is the Rails 8 default and the
point of the stack; Postgres changes the deployment shape enough to be its own
blueprint rather than an option.

## What it fits

- A server-rendered web application with accounts, built by a small team that
  wants one process, one database file and no JavaScript build.
- An internal tool or a first SaaS version that runs on one machine.
- A Ruby developer who wants the Rails 8 defaults with the authentication
  decisions made rather than left as generated.

## What it is NOT for

- **An API for a separate frontend or a mobile app.** This renders HTML and
  authenticates with a cookie. Use `dotnet-web-api`, `fastapi-service`,
  `go-http-service` or `ts-http-service`.
- **A React or TypeScript front end.** Use `nextjs-fullstack-app`.
- **More than one application server.** SQLite on local disk is one machine.
  Moving to Postgres changes `config/database.yml`, the Solid adapters'
  databases and the container's storage story.
- **Sign-up, roles or multi-tenancy.** None of it is here. For tenant
  isolation in an API, `dotnet-multitenant-saas-api`.
- **A background worker without a web application.** Use
  `python-background-worker`.
- **Deployment.** Kamal is skipped; the image is built and started locally and
  nothing ships it anywhere.

## Pros

- **Protected by default, and a test says so.** Every controller inherits
  `require_authentication`; the dashboard test fails the day that stops being
  true.
- **Sessions expire.** As generated, a session lives until sign-out behind a
  cookie that expires in twenty years. Here the lookup refuses anything older
  than `Session::MAX_AGE`, in both places a session is looked up.
- **The job has a reason to exist**, and its test covers both the body
  (`perform_enqueued_jobs`) and the enqueueing (`assert_enqueued_with`).
- **The security tools run in the setup, not only in CI.** Brakeman must report
  zero warnings; RuboCop must pass on the added code as well as the generated.
- **The container is proved, not only built**: non-root, no master key inside,
  boots in production mode with the job supervisor, answers `/up`, and
  redirects `/` without a session.
- **The CI workflow Rails generates is kept**, with its actions pinned by
  commit instead of by moving tag.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **SQLite in a container needs a volume.** Without one mounted at
  `/rails/storage`, a restart loses every user and session.
- **Solid Queue does not start on its own.** Production needs `bin/jobs` or
  `SOLID_QUEUE_IN_PUMA=1`; without either, jobs are accepted and never run.
- **No Content Security Policy.** Rails generates the initializer commented
  out, and this blueprint leaves it that way.
- **Password reset mail is not delivered in production** until SMTP is
  configured; the job fails quietly in the queue.
- **A short password on reset is reported as "Passwords did not match."** The
  generated controller has one message for every failure.
- **Only direct dependencies are pinned in the `Gemfile`.** `Gemfile.lock` pins
  the rest on the day the recipe runs, so a later run can resolve a newer
  transitive gem.
- **Gems install into the active Ruby's gem directory**, as Rails assumes. Use
  a version manager; never install them with elevated privileges.

## Trade-offs made on your behalf

- **SQLite, not Postgres.** The Rails 8 default, and what makes one process and
  no services possible. The cost is one machine.
- **Fifteen characters, not eight.** ASVS 5.0 requires 8 and strongly
  recommends 15; with no breached-password check here, the longer floor does
  more work.
- **Thirty days absolute, no inactivity timeout.** A starting point for a
  low-risk application. A banking screen wants minutes.
- **Kamal, Active Storage, Action Text, Action Mailbox, Jbuilder and system
  tests skipped.** Each is something the recipe could not verify; add them
  with their generators when the application needs them.
- **Assume-SSL and force-SSL on in production**, which is what Rails generates
  without Kamal: the application expects a TLS-terminating proxy in front.

## Cost of adoption

About fifteen minutes on a warm machine, most of it `bundle install` and the
image build. Requires Ruby 3.3 or newer from a version manager, Git, Docker and
curl.

## Compared with the alternatives here

The only Ruby blueprint in the catalog, and the only `web` blueprint that is
server-rendered with cookie sessions. `nextjs-fullstack-app` is the nearest
neighbour by shape — a full-stack web application with CI — and differs in
language, rendering model, database and in having no authentication.
