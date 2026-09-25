# Ruby Senior Software Architect

## What it changes

An agent working on a Rails application without this expert writes idiomatic
Rails: a model with five callbacks, one of which sends mail; a concern shared
by two models that holds a pricing rule; an `order.customer.account.plan`
chain across what should be three modules; a job enqueued in the middle of a
transaction. All of it passes the tests. None of it fails when the design
breaks, and most of it is structural to remove once the application is large.

This expert moves the design into things that fail:

- **Four decisions first** — the Ruby and Rails line with their end dates,
  packs or engines, Sorbet or RBS or neither, and where side effects live.
- **Bundler as the build** — the lock committed with checksums and the
  production platform, installed frozen, with bundler-audit and Brakeman
  failing CI as Rails 8.1 generates them.
- **Packs with the rules on** — Packwerk in strict mode, a
  `package_todo.yml` that only shrinks, privacy through packwerk-extensions.
- **Zeitwerk proves the tree** — `zeitwerk:check` and eager loading in CI, no
  hand `require` of application code.
- **Active Record inside its pack** — callbacks that touch only their own
  record, external effects after commit, jobs enqueued after the transaction.
- **One typing decision, ratcheted** — Sorbet sigils that only rise, or RBS
  checked by Steep.

## What it fits

- Starting a Rails 8.1 application on Ruby 4.0 or 3.4, while it is still one
  pack and splitting it is cheap.
- Reviewing a Rails monolith that has grown past the point where "just put it
  in the model" works, or a change that adds a callback, a concern or a
  cross-module call.
- Upgrading Ruby or Rails — the migration-plan deliverable.
- Plain Ruby gems: the Bundler, Zeitwerk and typing checklists apply.

## What it does not fit

- **Hanami, Sinatra or Roda applications.** Bundler, typing and Zeitwerk
  transfer; Active Record, packs-rails and the Rails generator checks do not.
- **Application security** — authentication, authorization, fixing what
  Brakeman reports: `security-reviewer` and `docs/review-standards.md`.
- **Schema design and query tuning** — `sql-data-engineer`.
- **Puma, YJIT and memory tuning** — `performance-engineer` and
  `devops-platform-engineer`.
- **Scaffolding a new application.** That is a blueprint's job
  (`rails-web-app` is an open pull request); this expert reviews what the
  scaffold produces.

## Pros and cons

**In its favour:** every rule is a command exit code, a grep, or a key in a
YAML file. It catches the three Rails failures that pass every test in
development — a misnamed file that only production's eager load touches, a
side effect that survives a rollback, and a job that runs before its row
exists.

**Against it:** packs are overhead in a small application, and Packwerk on an
existing monolith starts with thousands of recorded violations; strict mode
on new packs is what makes that adoptable, not painless. Sorbet in strict
mode is a real cost on a codebase that never had types, and the expert's
answer — choose one tool or none, and write down which — will not satisfy a
team that wants to try both.
