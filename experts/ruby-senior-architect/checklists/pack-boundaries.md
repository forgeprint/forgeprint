# Pack boundaries

Every constant in a Rails application is reachable from every file. A pack
boundary exists where `bin/packwerk check` fails on a reference across it —
or, with engines, where the engine's load path does not include the caller.

| #   | Check                                                                             | How                                                                          | Source                                     |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| PB1 | One boundary mechanism is chosen and recorded: Packwerk packs or Rails engines    | the ADR; `packwerk.yml` at the root, or engines under `engines/`             | Packwerk 3.3; Rails 8.1 — engines guide    |
| PB2 | `bin/packwerk validate` and `bin/packwerk check` run in CI                        | read the workflow or `config/ci.rb`                                          | Packwerk 3.3 — usage                       |
| PB3 | Every pack's `package.yml` has `enforce_dependencies`, and new packs use `strict` | `grep -L "enforce_dependencies: strict" $(find packs -name package.yml)`     | Packwerk 3.3 — usage: strict mode          |
| PB4 | Each pack lists its dependencies, and the graph has no cycle                      | read `dependencies:`; `bin/packwerk validate` fails on a cycle               | Packwerk 3.3 — usage                       |
| PB5 | `package_todo.yml` files do not grow in a pull request                            | `git diff main --stat -- '*package_todo.yml'` shows only deletions           | Packwerk 3.3 — usage: package todo         |
| PB6 | Privacy is enforced: only a pack's public folder is referenced from outside       | `enforce_privacy: true` or `strict`, with packwerk-extensions in the Gemfile | packwerk-extensions 0.3.0                  |
| PB7 | Zeitwerk load paths include each pack's `app/*` directories                       | `packs-rails` in the Gemfile, or the paths added in `config/application.rb`  | packs-rails 0.1.0; Rails 8.1 — autoloading |

## Why each one

**PB3** because `enforce_dependencies: true` records a new violation in
`package_todo.yml` and lets the check pass. The boundary then erodes one
recorded exception at a time. `strict` makes a new violation fail.

**PB5** is the rule Packwerk's own documentation states: `update-todo` is
for recording what already exists and removing what was fixed, and running
it to resolve a violation is the last resort. A growing todo file is a
boundary being given up in review.

**PB6** because Packwerk 3 moved privacy out of the core into
packwerk-extensions. A pack that declares dependencies but not privacy lets
every caller reach its internals as long as the dependency is listed.
