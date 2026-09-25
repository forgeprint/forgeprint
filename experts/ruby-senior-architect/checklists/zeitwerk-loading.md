# Zeitwerk loading

Zeitwerk maps file names to constant names. A mismatch works in development,
where constants load lazily and some are never touched, and fails in
production, where everything is eager loaded at boot.

| #   | Check                                                                       | How                                                                         | Source                                           |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| ZL1 | `bin/rails zeitwerk:check` passes                                           | run it; it runs in CI                                                       | Rails 8.1 — autoloading and reloading constants  |
| ZL2 | The test environment eager loads in CI                                      | `config/environments/test.rb` has `config.eager_load = ENV["CI"].present?`  | Rails 8.1 app generator — `test.rb`              |
| ZL3 | No `require` or `require_relative` of an autoloaded file                    | `grep -rn "require_relative\|require \"\./\|require '\./" app lib packs`    | Rails 8.1 — autoloading: do not require          |
| ZL4 | `lib/` is autoloaded with `config.autoload_lib(ignore: [...])`, not by hand | read `config/application.rb`                                                | Rails 8.1 — autoloading: `autoload_lib`          |
| ZL5 | Acronyms are declared as inflections, and file names follow them            | read `config/initializers/inflections.rb`; `zeitwerk:check` passes          | Rails 8.1 — autoloading: customizing inflections |
| ZL6 | No reloadable constant is captured in an initializer                        | grep `config/initializers` for application class names outside `to_prepare` | Rails 8.1 — autoloading: use case, initializers  |

## Why each one

**ZL1 and ZL2** together are the whole point. `zeitwerk:check` walks the tree
and eager loads it once; eager loading in CI makes every test run boot the
application the way production does. Either one catches
`app/services/pdf_export.rb` defining `PDFExport` before a customer does.

**ZL3** because a manual `require` of a file Zeitwerk also manages loads the
constant outside the autoloader. The Rails guide says outright that such a
`require` is neither needed nor wanted; the symptoms are "already initialized
constant" warnings and a class that does not reload in development.

**ZL6** because a reloadable class captured by an initializer is the stale
copy after the first reload — the Rails guide calls this out as the use case
`to_prepare` exists for.
