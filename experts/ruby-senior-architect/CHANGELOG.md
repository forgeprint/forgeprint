# Changelog

## 1.0.0 — 2026-09-25

The catalog's Ruby architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: the Ruby and Rails line with their
  end dates, the boundary mechanism (Packwerk packs or Rails engines), the
  typing tool (Sorbet, RBS with Steep, or none), and where side effects live.
- Bundler as the build: `Gemfile.lock` committed with its `CHECKSUMS`
  section, the deployment platform in `PLATFORMS`, `frozen` in CI and
  production, `bundler-audit` and Brakeman failing the build.
- Boundaries Packwerk 3.3 can check: `enforce_dependencies: strict`,
  `package_todo.yml` that only shrinks, privacy through packwerk-extensions.
- Zeitwerk proves the tree: `bin/rails zeitwerk:check` and eager loading in
  CI, no `require` of application code.
- Active Record kept inside its pack: callbacks touch only their own record,
  side effects after commit, jobs enqueued after the transaction.
- One typing decision, enforced: Sorbet sigils that only rise, or RBS
  signatures checked by Steep.
- Ten refusals and five checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every version was read from ruby-lang.org, rubyonrails.org, RubyGems or the
tool's own repository on 2026-09-25. The expert has not been manually
verified against a real project — `provenance: generated` says so
(ADR 0011).
