# Rails Web App — agent context

A Rails 8.1 application on SQLite, with the authentication Rails generates and
three decisions added to it: passwords have a floor, sessions have an absolute
lifetime, and a recurring job removes the expired ones. Read this before adding
a page, a model or a job.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/controllers/concerns/authentication.rb  the session lookup every request goes through
app/models/session.rb                       MAX_AGE, and the active/expired scopes
app/models/user.rb                          has_secure_password, and the password floor
app/channels/application_cable/connection.rb  the same lookup, for WebSockets
app/controllers/dashboard_controller.rb     the one page behind sign-in (the root)
app/jobs/purge_expired_sessions_job.rb      deletes what the lookup already refuses
config/recurring.yml                        when Solid Queue runs that job in production
config/database.yml                         four SQLite files: primary, cache, queue, cable
Dockerfile, bin/docker-entrypoint           the generated production image, non-root
```

## Every action requires a session unless it says otherwise

`ApplicationController` includes `Authentication`, which adds
`before_action :require_authentication`. A new controller is protected without
writing anything; a public one says so with
`allow_unauthenticated_access` (optionally `only:`), the way
`SessionsController` and `PasswordsController` do.

- **Do not add a `before_action` that skips it for convenience**, and do not
  inherit from `ActionController::Base` to get around it. Both produce a page
  that is public by accident, and nothing fails.
- **A new controller gets a test that it redirects without a session.**
  `test/controllers/dashboard_controller_test.rb` is the pattern: one request
  with no cookie, `assert_redirected_to new_session_path`. That test is what
  catches the day somebody opts a controller out by mistake.
- **`/up` is the only public route outside authentication**, and it touches no
  session and no database so a load balancer can call it.

## Sessions have an absolute lifetime, in one place

`Session::MAX_AGE` is 30 days. `Authentication#find_session_by_cookie` and
`ApplicationCable::Connection#set_current_user` both look sessions up through
`Session.active`, so an expired session is refused on the next request, and the
cookie expires at the same moment.

- **Any new way of finding the current user goes through `Session.active`.** A
  second lookup through `Session.find_by` is a session that never expires; the
  generated Action Cable connection did exactly that until this blueprint
  changed it.
- **`PurgeExpiredSessionsJob` is housekeeping, not the control.** It deletes
  rows the lookup already refuses. If Solid Queue is not running, sessions still
  expire; the table just grows.
- **Change `MAX_AGE`, not the scopes.** Thirty days is a starting point, and the
  number should be written down with a reason (OWASP ASVS 5.0, 7.1.1). There is
  no inactivity timeout; add one to `Session.active` if the application needs
  it.

## Passwords

`validates :password, length: { minimum: 15 }` in `User`, because
`has_secure_password` sets no minimum (OWASP ASVS 5.0, 6.2.1). There is no
sign-up form: the generator creates sign-in, sign-out and password reset only.
When you add registration, it uses the same model and inherits the floor —
do not validate the password again in a form object with a different number.

Password reset tokens expire after 15 minutes, and a successful reset destroys
every session the user had. Keep both when changing `PasswordsController`.

## Background jobs run on Solid Queue, in the database

In development and test, jobs use the adapter Rails configures there; in
production they go to the `queue` SQLite database and run under the Solid Queue
supervisor. **The supervisor does not start itself.** Either run `bin/jobs` as
its own process, or set `SOLID_QUEUE_IN_PUMA=1` so it runs inside the web
server. A deployment that does neither accepts jobs and never runs them, and
nothing reports it.

- Arguments are serialised into the database. Pass an id, not a record, and
  treat what arrives as input: the job may run after the record changed.
- A recurring job belongs in `config/recurring.yml` under `production`, with a
  `class:` and a `queue:`, and gets a test in `test/jobs/`.
- Test the body with `perform_enqueued_jobs`, and the enqueueing with
  `assert_enqueued_with`. `purge_expired_sessions_job_test.rb` does both.

## SQLite is the production database here

Four files under `storage/`, one per role. That is a single-server design: the
files live in the container's filesystem, so **a container without a volume
mounted at `/rails/storage` loses every user and session on restart**. It also
means one writer at a time; Rails configures SQLite for that, and it is fine
until the application needs more than one machine.

Migrations go through `bin/rails db:migrate` and are committed with
`db/schema.rb`. The entrypoint runs `db:prepare` when the container starts the
server, so a new image migrates itself.

## Secrets

`config/master.key` decrypts `config/credentials.yml.enc`. It is in
`.gitignore` and `.dockerignore`, and the setup checks both. Never commit it,
never copy it into the image, never print it. In production supply it as
`RAILS_MASTER_KEY`, or supply `SECRET_KEY_BASE` directly, from the platform's
secret store.

## Commands

```
bin/rails db:migrate      apply migrations, update db/schema.rb
bin/rails test            the suite
bin/rubocop               style, Rails omakase rules
bin/brakeman --no-pager   static security analysis; must stay at zero warnings
bin/bundler-audit         known vulnerabilities in the locked gems (fetches its database)
bin/importmap audit       known vulnerabilities in pinned JavaScript
bin/rails server          development server
bin/jobs                  Solid Queue supervisor
```

## When you are asked to add a page

1. `bin/rails generate controller Things index --no-helper`, then read what it
   wrote: it inherits `ApplicationController`, so it is already protected. The
   test it generates expects `:success` without signing in and fails with a
   redirect. That failure is correct; fix the test, not the controller.
2. If it must be public, add `allow_unauthenticated_access` with `only:` and a
   comment saying why.
3. Add the redirect test for the protected case, and a signed-in test with
   `sign_in_as users(:one)`.
4. Run `bin/rails test`, `bin/rubocop` and `bin/brakeman --no-pager` before
   calling it done.

## What this does not do

No sign-up, no roles or authorization beyond "signed in", no email delivery
configured for production (password reset mail is enqueued, not sent), no
Content Security Policy (the generated initializer is left commented out), no
file uploads (Active Storage is skipped), no deployment tool (Kamal is skipped),
no system tests.
