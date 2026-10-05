# Changelog — rails-web-app

## 1.2.1 — 2026-10-05

The health check in step 29 now says why it failed.

It spent three rounds of debugging printing sixty identical `curl: (7)` lines
and not one word about the container, while a single `docker logs` answered the
whole question — the container had died in `db:prepare` and nothing was
listening. The check is the same; it drops curl's per-attempt noise and, when
the retries run out, prints the last forty lines of the container's log before
failing.

Measured against a container that publishes a port and never listens:

|        | exit | output                                            |
| ------ | ---- | ------------------------------------------------- |
| before | 52   | four identical lines, nothing about the container |
| after  | 1    | the container's own error                         |

Both fail, which was never the problem. Only one of them tells you what to fix.

## 1.2.0 — 2026-10-05

The recipe now configures the production databases it always claimed to set
up, which is what the container needed to start at all.

`rails new` leaves every production path in `config/database.yml` commented
out — Rails does not presume a location for a SQLite file that has to outlive
the container, and the developer is expected to choose one. Nothing in the
recipe chose. So the production boot died inside `db:prepare` with
`ArgumentError: No database file specified`, the container exited 1, and the
health check spent sixty seconds failing to connect to a port nothing was
listening on. A new step 25 writes the four paths under `storage`; the old
steps 25 to 30 are now 26 to 31.

Found the way the previous two were: by the recipe finally running far enough
to reach it. Steps 29 and 30 had never executed either, and both pass now —
the protected root answers 302, which is what step 30 asserts.

The health check is unchanged, and it is worth saying why it was so unhelpful:
sixty identical `curl: (7)` lines and not one word about the container. One
`docker logs` gave the whole answer in a second. That is a defect in how the
step reports rather than in what it checks, and it is left for its own change.

## 1.1.0 — 2026-10-05

Two steps could not pass. Both were found by the first `setup-test` run that
ever executed this recipe: 1.0.0 merged while the job was still waiting for
Ruby on the runner, so nothing had run it until then.

**Step 14** used `Fugit`, which Solid Queue brings in as a transitive
dependency and requires lazily, inside a code path `bin/rails runner` never
loads. Zeitwerk autoloads the application, not gems, so the constant was
absent and the step raised `uninitialized constant Fugit`. The script requires
the gem before using it.

**Step 23** ran `bin/brakeman`, and Rails' binstub for it adds
`--ensure-latest` — which fails whenever a newer Brakeman exists than the one
the Gemfile pins, and scans nothing on the way out. Brakeman 8.1.0 was
released on 2026-10-01 and the step broke the same day. It now runs
`bundle exec brakeman`, which respects the pin, as step 4's version check
already did. The `ci.yml` the recipe writes changes the same way and for the
same reason: otherwise every project started from this blueprint goes red on
somebody else's release schedule.

The pinned Brakeman stays at 8.0.6. Bumping it is a separate decision — a
Brakeman minor release adds checks, and new checks can fail step 23 on their
own merits, which is worth finding out deliberately rather than inside a fix.

## 1.0.0 — 2026-09-25

First version, and the catalog's first Ruby blueprint.

Rails 8.1.4 on SQLite with the Rails 8 defaults — Solid Queue, Solid Cache and
Solid Cable in the database, Propshaft, import maps — and the built-in
authentication generator.

**Generated** from
[the 2026-09-24 demand research](../../docs/research/2026-09-24-demand.md),
where this combination had no blueprint at all: Ruby on Rails at 5.9% in the
Stack Overflow 2025 survey, and RubyGems all-time totals of 791.8M for `rails`,
26.9M for `kamal` and 25.8M for `solid_queue`. Its recipe runs in CI like every
other; nobody has built an application on it and it has not been manually
verified, so it is `tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

What was decided, rather than generated:

- **A 15-character password floor.** `has_secure_password` sets none; OWASP
  ASVS 5.0 6.2.1 requires 8 and strongly recommends 15. The generated password
  tests used three-character passwords and were rewritten, with a test for the
  refusal added.
- **An absolute session lifetime of 30 days.** As generated, a session lasts
  until sign-out, behind a cookie that expires in twenty years. The lookup now
  goes through `Session.active` — in the authentication concern **and** in the
  Action Cable connection, which the generator writes with its own lookup —
  and the cookie expires with the session.
- **`PurgeExpiredSessionsJob`**, scheduled daily in `config/recurring.yml`, as
  the background job the blueprint claims. It is housekeeping; the lookup is
  the control.
- **Every gem the application names pinned exactly** in the `Gemfile`,
  including Brakeman 8.0.6, RuboCop 1.91.0 and rubocop-rails-omakase 1.1.0, so
  the security scan and the style check the recipe asserts on do not move
  under it.
- **The generated CI workflow kept, pinned by commit** (`actions/checkout`
  v7.0.1, `ruby/setup-ruby` v1.326.0) with `permissions: contents: read`. The
  generator writes moving tags and the default token.
- **Skipped:** Kamal, Active Storage, Action Text, Action Mailbox, Jbuilder and
  system tests — each something the recipe could not verify.

Versions were read from the RubyGems API on 2026-09-24 and re-checked on
2026-09-25. The Ruby floor is 3.3, not the 3.2 Rails 8.1 accepts, because
`solid_cable` 4.0 requires 3.3.

**How it was tested.** No Ruby was available where it was drafted, so the
recipe's only execution is `forgeprint test-setup` in CI on `ubuntu-latest`
with Ruby 4.0 and Docker. That run is the record; see the pull request.

### Planned

- A Postgres blueprint for the multi-server case, rather than an option here.
- Content Security Policy, once somebody decides what the policy is.
