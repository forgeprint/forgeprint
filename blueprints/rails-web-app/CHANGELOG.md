# Changelog — rails-web-app

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
